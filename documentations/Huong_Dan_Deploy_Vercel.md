# Hướng dẫn xử lý: Vercel không deploy khi push commit mới lên Git

## Vấn đề

Bạn đã push commit mới nhất lên GitHub/GitLab/Bitbucket nhưng Vercel không tự động tạo deployment mới, hoặc Vercel vẫn đang deploy **commit cũ** thay vì **commit mới nhất** trên nhánh `master`.

---

## ⭐ Trường hợp đặc biệt: Vercel deploy commit cũ thay vì commit mới nhất

**Triệu chứng:** GitHub đã có commit mới (vd: "Update rewrites for vercel") nhưng Vercel Production vẫn hiển thị commit cũ (vd: "Buổi 20: AutoComplete Search Board..."). Repo đã kết nối, chỉ có 1 nhánh `master`.

### Nguyên nhân có thể

1. **Vercel vừa mới kết nối Git** → Webhook chưa nhận được sự kiện push của commit mới.
2. **Nút "Redeploy" trên deployment cũ** → Chỉ build lại **cùng commit đó**, không pull code mới từ GitHub.
3. **Cache hoặc đồng bộ** → Vercel đang dùng dữ liệu cũ.

### Cách xử lý (theo thứ tự ưu tiên)

#### Bước 1: Push empty commit để trigger deployment mới (khuyến nghị)

Mỗi lần push, GitHub gửi webhook đến Vercel → Vercel tạo deployment mới từ **commit mới nhất** trên branch:

```bash
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin master
```

Đợi vài phút, vào Vercel Dashboard → Deployments để xem deployment mới từ commit vừa push.

#### Bước 2: Bật Commit Comments để theo dõi

Vào **Vercel Dashboard** → **Project Settings** → **Git** → bật **Commit Comments**.

Khi bật, Vercel Bot sẽ comment trực tiếp trên từng commit trên GitHub, giúp bạn biết deployment thành công hay thất bại. Nếu tắt, bạn sẽ không thấy phản hồi trên commit khi deployment không chạy.

#### Bước 3: Clear Build Cache rồi redeploy

1. Vào **Vercel Dashboard** → Project → **Settings** → **Build & Development Settings**
2. Bật **Clear Build Cache**
3. Push thêm một commit (có thể dùng empty commit như Bước 1) hoặc bấm **Redeploy** từ deployment mới nhất

#### Bước 4: Disconnect và kết nối lại Git (nếu vẫn không được)

1. Vào **Settings** → **Git** → **Disconnect** repo
2. **Connect** lại repository `Toilatoithoi/trello-web`
3. Push empty commit:

```bash
git commit --allow-empty -m "Reconnect Vercel - trigger deploy"
git push origin master
```

#### Bước 5: Deploy thủ công bằng Vercel CLI

Nếu vẫn không có deployment từ Git:

```bash
npm i -g vercel
vercel login
vercel --prod
```

Lệnh này deploy **code local hiện tại** (đảm bảo đã `git pull` về đúng commit mới nhất trước khi chạy).

---

**Lưu ý quan trọng:** Nút **Redeploy** trên một deployment cũ sẽ build lại **đúng commit đó**, không lấy code mới từ GitHub. Để deploy commit mới, bạn cần **tạo deployment mới** bằng cách push commit (kể cả empty commit) lên branch production.

**Tham khảo:** [Vercel Redeploy Not Using the Latest GitHub Commit - Vercel Community](https://community.vercel.com/t/vercel-redeploy-not-using-the-latest-github-commit/3959)

## Các bước kiểm tra và cách xử lý

### 1. Kiểm tra nhánh (Branch) đang push

Vercel chỉ tự động deploy khi push vào **Production Branch**:

- **main** (ưu tiên cao nhất)
- **master** (nếu không có main)
- [Bitbucket] "Production Branch" trong cài đặt repo
- Hoặc nhánh mặc định của repository

**Cách kiểm tra:**

```bash
git status
git branch -avv
```

- Xác nhận bạn đang ở đúng nhánh (thường là `main` hoặc `master`)
- Nếu đang ở nhánh khác (vd: `beta`, `develop`), push thêm vào nhánh production hoặc merge trước rồi mới push

**Tham khảo:** [Stack Overflow - Vercel not triggering new commits](https://stackoverflow.com/questions/74243449/vercel-not-triggering-new-commits-on-github)

---

### 2. Kiểm tra Git Integration và quyền truy cập

Theo [tài liệu chính thức của Vercel](https://vercel.com/kb/guide/why-aren-t-commits-triggering-deployments-on-vercel):

- Đảm bảo đã cài **Vercel for Git** và kết nối Git trong mục **Authentication** → **Account Settings**
- Nếu chỉ cấp quyền cho một số repo, repo của bạn phải nằm trong danh sách đó
- Tài khoản Git cần có quyền:
  - **GitHub:** Collaborator
  - **GitLab:** Maintainer
  - **Bitbucket:** Admin

---

### 3. Repository Private và quyền Team (Vercel)

Với **repository private** kết nối với Vercel Team:

- Bạn phải là **member của Pro Team** hoặc **Owner của Hobby Team** thì commit mới trigger được deployment
- Nếu không đủ quyền, có thể thấy lỗi: `Git author must have access to project`
- Kiểm tra **commit author** phải trùng với tài khoản Git đã liên kết Vercel

---

### 4. Repository Public và thay đổi cấu hình

Với **repository public**, khi thay đổi:

- `vercel.json`
- Environment Variables

thì **một thành viên Team trên Vercel phải authorize** deployment trước. Vercel sẽ gửi link authorize qua comment trên Pull Request.

---

### 5. Cấu hình Git author (metadata)

Email và tên trong commit phải **khớp với tài khoản Git** (GitHub/GitLab/Bitbucket) đã liên kết với Vercel:

```bash
git config --global user.name "TÊN_CỦA_BẠN"
git config --global user.email "email@example.com"
```

Kiểm tra author của commit gần nhất:

```bash
git log -1
```

Email phải khớp với tài khoản Git và dùng **chữ thường**.

---

### 6. Root Directory trong cài đặt Vercel

Nếu trong **Project Settings** trên Vercel, **Root Directory** được đặt là thư mục build (vd: `dist`, `build`):

- Vercel theo dõi thay đổi ở thư mục đó
- Code nguồn thay đổi nhưng chưa build → thư mục build không đổi → Vercel có thể không nhận ra thay đổi
- **Khuyến nghị:** Để Root Directory là `.` (root dự án), để Vercel chạy lệnh build từ code nguồn

**Tham khảo:** [Stack Overflow - Root Directory](https://stackoverflow.com/questions/74243449/vercel-not-triggering-new-commits-on-github)

---

### 7. Đọc comment của Vercel Bot trên commit/PR

Vercel Bot thường comment trên commit hoặc Pull Request để báo:

- Deployment thành công hoặc thất bại
- Lỗi validation (vd: `vercel.json` sai định dạng) → có thể khiến deployment không được tạo
- Thông tin cần authorize (env, config...)

---

### 8. Nhiều tài khoản Vercel dùng chung một Git

Một tài khoản Git **chỉ có thể liên kết với một tài khoản Vercel** tại một thời điểm. Nếu liên kết tài khoản Git với Vercel khác, kết nối cũ có thể bị ngắt, dẫn tới commit không trigger deployment như trước.

---

### 9. Thử thực hiện lại

Một số trường hợp chỉ cần:

- Commit và push lại
- Kiểm tra lại branch và thông tin author
- Đảm bảo repo đã được kết nối đúng trong Vercel

---

## Checklist nhanh

| Kiểm tra | Hành động |
|----------|-----------|
| Đang push vào `main` hoặc `master`? | `git branch` |
| Git Integration đã cài? | Vercel Dashboard → Settings → Git |
| Email commit trùng với Git account? | `git log -1` |
| Root Directory có đặt đúng? | Vercel → Project Settings → Root Directory |
| Repo private → đủ quyền Team? | Kiểm tra quyền member Vercel |
| Thay đổi `vercel.json`/env (repo public)? | Cần Team member authorize |

---

## Tài liệu tham khảo

- [Why aren't commits triggering deployments on Vercel? | Vercel KB](https://vercel.com/kb/guide/why-aren-t-commits-triggering-deployments-on-vercel)
- [Vercel not triggering new commits on Github | Stack Overflow](https://stackoverflow.com/questions/74243449/vercel-not-triggering-new-commits-on-github)
- [Vercel Redeploy Not Using the Latest GitHub Commit | Vercel Community](https://community.vercel.com/t/vercel-redeploy-not-using-the-latest-github-commit/3959)
