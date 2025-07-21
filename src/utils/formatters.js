export const capitalizeFirstLetter = (val) => {
  if (!val) return ''
  return `${val.charAt(0).toUpperCase()}${val.slice(1)}`
}

/**
* Video 37.2 hàm generatePlaceholderCard: Cách xử lý bug logic thư viện Dnd-kit khi column là rỗng:
* Phía FE sẽ tự tạo một cái card đặc biệt: PlaceholderCard, không liên quan tới Back-end
* Card đặc biệt này sẽ được ẩn ở giao diện UI người dùng.
* Cấu trúc Id của cái card này được để Unique rất đơn gian, không cần phải làm random phức tạp:
* "columnId-placeholder-card" (mỗi column chỉ có thể có tối đá một cái PlaceholderCard)
* Quan trọng khi tạo: phải đầy đủ: (_id, boardId, columnId, FE_PlaceholderCard)
*/
export const generatePlaceholderCard = (column) => {
  return {
    _id: `${column._id}-placeholder-card`,
    boardId: column.boardId,
    columnId: column._id,
    FE_PlaceholderCard: true
  }
}

//Kỹ thuật dùng css pointer-event-đề chận-user-spam click tại bất kỳ chi nào có hành động click-gọi-api
//// Đây là một kỹ thuật rất hay tận dụng Axios Interceptors và CS5 Pointer-events đề chỉ phải viết code xửLý một lần cho toàn bộ dự án
// Cách sử dụng: Với tất cả các link hoặc button mà có hành động gọi api thì thêm class "interceptor-loading" cho nó là xong.
export const interceptorLoadingElements = (calling) => {
  //-DOM-Lây ra toàn bộ phần tử trên page hiện tại có className là 'interceptor-loading'
  const elements = document.querySelectorAll('.interceptor-loading')
  for (let i = 0; i < elements.length; i++) {
    if (calling) {
      // Nều đang trong thời gian chờ gọi API (calling true) thì sẽ làm mờ phần tử và chấn click bằng css pointer-events
      elements[i].style.opacity = '0.5'
      elements[i].style.pointerEvents = 'none'
    } else {
      // Ngược lại thì trả về như ban đầu, không làm gì cả
      elements[i].style.opacity = 'initial'
      elements[i].style.pointerEvents = 'initial'
    }
  }
}