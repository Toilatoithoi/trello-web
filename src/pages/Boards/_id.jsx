import { useEffect } from 'react'
import Container from '@mui/material/Container'
import AppBar from '~/components/AppBar/AppBar'
import BoardBar from './BoardBar/BoardBar'
import BoardContent from './BoardContent/BoardContent'
// import { mockData } from '~/api/mock-data'
import {
  updateBoardDetailsAPI,
  updateColumnDetailsAPI,
  moveCardToDifferentColumnAPI
} from '~/api'
import { cloneDeep } from 'lodash'
import {
  fecthBoardDetailsAPI,
  updateCurrentActiveBoard,
  selectCurrentActiveBoard
} from '~/redux/activeBoard/activeBoardSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import PageLoadingSpinner from '~/components/PageLoading/PageLoadingSpinner'

function Board() {
  const dispatch = useDispatch()
  // Không dùng State của component nữa mà chuyển qua dùng State của Redux
  // const [board, setBoard] = useState(null)
  const board = useSelector(selectCurrentActiveBoard)

  const { boardId } = useParams()

  useEffect(() => {
    // Call API
    // Bắt buộc phải bộc API trong dispatch khi gọi vào redux (dispatch là middleware của redux)
    dispatch(fecthBoardDetailsAPI(boardId))
    // Nếu 1 biến thì không cần (board) chỉ cần board
    // fecthBoardDetailsAPI(boardId).then(board => {
    //   // Sắp xếp thứ tự các cards luôn ở đây trước khi đưa dữ liệu xuống bên dưới các component con (video 71 đã giải thích lý do ở phần fix bug quan trọng)
    //   board.columns = mapOrder(board?.columns, board.columnOrderIds, '_id')

    //   board.columns.forEach(column => {
    //     // Khi F5 trang web thì cần xử lý vấn đề kéo thả vào một column rỗng (Nhớ lại video 37.2, code hiện tại là video 69)
    //     if (isEmpty(column.cards)) {
    //       column.cards = [generatePlaceholderCard(column)]
    //       column.cardOrderIds = [generatePlaceholderCard(column)._id]
    //     }
    //     else {
    //       // Sắp xếp thứ tự các cards luôn ở đây trước khi đưa dữ liệu xuống bên dưới các component con (video 71 đã giải thích lý do ở phần fix bug quan trọng)
    //       // Do mảng card trong column chưa được cập nhật lại vị trí index của card dù cardOrderIds đã được cập nhật, lỗi này chỉ xảy ra lần đầu tiên kéo thả card
    //       column.cards = mapOrder(column.cards, column.cardOrderIds, '_id')
    //     }
    //   })

    //   setBoard(board)
    // })
  }, [dispatch, boardId])

  /**
   * Function này có nhiệm vụ gọi API và xử lý khi kéo thả Column xong xuôi
   * Chỉ cần gọi API để cập nhật mảng cardOrderIds của Board chứa nó (thay đổi vị trí trong board)
   */
  const moveColumns = async (dndOrderedColumns) => {
    // Update cho chuần dữ liệu state Board
    const dndOrderedColumnIds = dndOrderedColumns.map(c => c._id)
    /**
     * Trường hợp dùng Spread Operator này thì lại không sao bởi vì ở đây chúng ta không dùng push như ở trên Làm thay đổi trực tiếp kiểu mở rộng máng, mà chì đang gán lại toàn bộ giá trị columns và columnOrderIds bằng 2 màng mới. Tương tự như cách làm concat ở trường hợp createNewColumn thôi :))
    */
    const newBoard = { ...board }
    newBoard.columns = dndOrderedColumns
    newBoard.columnOrderIds = dndOrderedColumnIds
    // setBoard(newBoard)
    dispatch(updateCurrentActiveBoard(newBoard))

    // Gọi API update Board
    updateBoardDetailsAPI(newBoard._id, { columnOrderIds: newBoard.columnOrderIds })
  }

  /**
   * Khi di chuyển card trong cùng Column:
   * Chỉ cần gọi API để cập nhật mảng cardOrderIds của Column chứa nó (thay đổi vị trí trong mảng)
   */
  const moveCardInTheSameColumn = (dndOrderCards, dndOrderedCardIds, columnId) => {
    // Update cho chuần dữ liệu state Board
    // const newBoard = { ...board }
    /**
     * Cannot assign to read only property 'cards' of object
     * Trường hợp Immutability ở đây đã đụng tới giá trị cards đang được coi là chỉ đọc read only object can thiệp sâu dữ liệu) (nested object - can thiệp sâu dữ liệu)
    */
    const newBoard = cloneDeep(board)
    const columnToUpdate = newBoard.columns.find(column => column._id === columnId)
    if (columnToUpdate) {
      columnToUpdate.cards = dndOrderCards
      columnToUpdate.cardOrderIds = dndOrderedCardIds
    }
    //setBoard(newBoard)
    dispatch(updateCurrentActiveBoard(newBoard))

    // Gọi API update Board
    updateColumnDetailsAPI(columnId, { cardOrderIds: columnToUpdate.cardOrderIds })
  }

  /**
  * Khi di chuyền card sang Column khác:
  * B1: Cập nhật màng cardOrderIds của Column ban đầu chứa nó (Hiểu bản chất là xóa cái id của Card ra khỏi mảng)
  * B2: Cập nhật mảng cardOrderIds của Column tiếp theo (Hiểu bản chất là thêm id của Card vào màng)
  * B3: Cập nhật lại trường columnId mới của cái Card đã kéo
  * => Làm một API support riêng.
  */
  const moveCardToDifferentColumn = (currentCardId, prevColumnId, nextColumnId, dndOrderedColumns) => {
    // Update cho chuần dữ liệu state Board
    const dndOrderedColumnIds = dndOrderedColumns.map(c => c._id)
    // Tương tự đoạn xử lý chỗ hàm moveColumns nên không ảnh hưởng Redux Toolkit Immutability gì ở đây cả.
    const newBoard = { ...board }
    newBoard.columns = dndOrderedColumns
    newBoard.columnOrderIds = dndOrderedColumnIds
    // setBoard(newBoard)
    dispatch(updateCurrentActiveBoard(newBoard))

    // Gọi API xử lý phía BE
    let prevCardOrderIds = dndOrderedColumns.find(c => c._id === prevColumnId)?.cardOrderIds
    if (prevCardOrderIds[0].includes('placeholder-card')) prevCardOrderIds = []

    moveCardToDifferentColumnAPI({
      currentCardId,
      prevColumnId,
      prevCardOrderIds,
      nextColumnId,
      nextCardOrderIds: dndOrderedColumns.find(c => c._id === nextColumnId)?.cardOrderIds
    })
  }

  if (!board) {
    return <PageLoadingSpinner caption="Loading Board..." />
  }

  return (
    <>
      <Container disableGutters maxWidth={false} sx={{ height: '100vh' }}>
        <AppBar />
        <BoardBar board={board} />
        <BoardContent
          board={board}
          // 3 cái trường hợp move dưới đây thì giữ nguyên đề code xử Lý kéo thà ở phần Board Cachen không bị quá dài mất kiểm soát khi đọc code, maintain.
          moveColumns={moveColumns}
          moveCardInTheSameColumn={moveCardInTheSameColumn}
          moveCardToDifferentColumn={moveCardToDifferentColumn}
        />
      </ Container>
    </>
  )
}

export default Board
