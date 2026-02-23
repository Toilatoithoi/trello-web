# Giải thích: Tại sao `/account/verification` hoạt động ở Local nhưng 404 ở Production (Vercel)

## Vấn đề

- **Local** (`http://localhost:5173/account/verification?...`): Trang hiển thị bình thường
- **Production** (`https://trello-web-henna-eta.vercel.app/account/verification?...`): Báo **404 NOT FOUND** (lỗi từ Vercel, không phải từ React Router)

Dù đã khai báo route:

```jsx
<Route path='/account/verification' element={<AccountVerification />} />
```

## Nguyên nhân: Sự khác biệt giữa Dev Server và Production Server

### Cách hoạt động ở Local (Vite Dev Server)

Khi chạy `npm run dev`, Vite dev server:

1. Nhận mọi request (vd: `/account/verification`, `/boards`, `/login`, …)
2. **Luôn trả về `index.html`** cho bất kỳ đường dẫn nào không phải file tĩnh
3. Trình duyệt load `index.html` → load React app
4. **React Router** chạy phía client và xử lý URL → render đúng component (vd: `AccountVerification`)

Tức là: mọi đường dẫn đều dẫn đến cùng một `index.html`, còn routing do React Router xử lý sau khi app đã load.

### Cách hoạt động ở Production (Vercel)

Ở môi trường production, Vercel **không tự biết** đây là SPA (Single Page Application). Mặc định, Vercel xử lý từng URL như **đường dẫn file thật** trên server:

1. User truy cập: `https://trello-web-henna-eta.vercel.app/account/verification`
2. Vercel tìm file hoặc route tương ứng `/account/verification`
3. Không tìm thấy file (chỉ có `index.html` ở gốc, không có folder/file `account/verification`)
4. Vercel trả về **404 NOT FOUND** (trang lỗi mặc định của Vercel)

React Router chưa bao giờ được chạy vì app React không load được, do server đã trả 404 ngay từ đầu.

## Sơ đồ minh họa

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LOCAL (Vite Dev Server)                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  Request: /account/verification                                          │
│       ↓                                                                  │
│  Vite: "Không phải file tĩnh" → trả về index.html                        │
│       ↓                                                                  │
│  Browser load index.html → React app khởi động                           │
│       ↓                                                                  │
│  React Router: khớp path "/account/verification" → render AccountVerification │
│       ↓                                                                  │
│  ✅ Trang hiển thị đúng                                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PRODUCTION (Vercel) - KHÔNG CẤU HÌNH REWRITE                            │
├─────────────────────────────────────────────────────────────────────────┤
│  Request: /account/verification                                          │
│       ↓                                                                  │
│  Vercel: tìm file/route cho /account/verification                        │
│       ↓                                                                  │
│  Không tồn tại file hoặc route server-side cho path này                  │
│       ↓                                                                  │
│  ❌ 404 NOT FOUND (lỗi mặc định của Vercel)                              │
│  React app không được load → React Router không chạy                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Giải pháp: Cấu hình Rewrites trong `vercel.json`

Cần khai báo **rewrite** để Vercel gửi **tất cả các đường dẫn** về `index.html`, để SPA xử lý routing phía client.

### Bước 1: Tạo file `vercel.json` ở thư mục gốc dự án

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Ý nghĩa:**

- `source: "/(.*)"`: Mọi URL (kể cả `/account/verification`, `/boards`, `/login`, …)
- `destination: "/index.html"`: Đều được chuyển hướng tới `index.html`
- Sau khi load `index.html`, React Router sẽ parse URL và render đúng component

### Bước 2: Deploy lại lên Vercel

Sau khi thêm `vercel.json`, commit và push để Vercel deploy lại. Các route như `/account/verification` sẽ hoạt động đúng trên production.

## Lỗi MIME type: "Expected a JavaScript module script but the server responded with a MIME type of text/html"

### Triệu chứng

Sau khi cấu hình rewrite, trang `/account/verification` load được nhưng console báo:

```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.
```

### Nguyên nhân

Build script dùng `--base=./` (đường dẫn tương đối). Khi user truy cập `/account/verification`:

1. Vercel trả về `index.html` (nhờ rewrite)
2. Trong `index.html`, script có dạng: `<script src="./assets/index-xxx.js">`
3. Đường dẫn `./assets/...` được resolve **so với URL hiện tại** → `/account/assets/index-xxx.js`
4. Trình duyệt request `/account/assets/index-xxx.js`
5. Không có file tại path đó → rewrite trả về `index.html` thay vì file JS
6. Browser nhận HTML nhưng mong đợi JavaScript → **lỗi MIME type**

### Cách sửa

Đổi **base** từ tương đối (`./`) sang **tuyệt đối** (`/`):

**Trong `package.json`:**

```json
"build": "cross-env BUILD_MODE=production vite build"
```

Bỏ `--base=./`. Vite mặc định dùng `base: '/'` → đường dẫn asset sẽ là `/assets/index-xxx.js` (tuyệt đối), hoạt động đúng ở mọi route.

**Hoặc trong `vite.config.js`** (nếu cần tùy chỉnh):

```js
export default defineConfig({
  base: '/',  // Đảm bảo dùng đường dẫn tuyệt đối
  // ...
})
```

Sau khi sửa: `npm run build` rồi deploy lại lên Vercel.

---

## Lưu ý quan trọng

1. **Route trong React Router không sai**  
   Khai báo `<Route path='/account/verification' ... />` là đúng. Vấn đề nằm ở cấu hình phía server (Vercel) hoặc base path của build, không phải ở logic routing phía client.

2. **Đây là vấn đề chung của mọi SPA trên Vercel**  
   Mọi app dùng React Router, Vue Router, Angular Router… đều cần cấu hình tương tự.

3. **Trang 404 bạn thấy là của Vercel**  
   Code `Code: 'NOT_FOUND'` và nút "Read our documentation" là trang lỗi mặc định của Vercel, không phải component `<NotFound />` trong app.

4. **Base path `./` gây lỗi với SPA + client-side routing**  
   Khi dùng đường dẫn tương đối, asset path phụ thuộc URL hiện tại → dễ gây MIME error khi truy cập deep link trực tiếp.

## Tài liệu tham khảo

- [Vercel - Why is my deployed project showing a 404 error?](https://vercel.com/kb/guide/why-is-my-deployed-project-giving-404)
- [Vercel - Rewrites Documentation](https://vercel.com/docs/rewrites)
