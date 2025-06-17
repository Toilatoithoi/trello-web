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