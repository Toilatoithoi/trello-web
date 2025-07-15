import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { API_ROOT } from '~/utils/constants'
import { mapOrder } from '~/utils/sorts'
import { isEmpty } from 'lodash'
import { generatePlaceholderCard } from '~/utils/formatters'

// Khởi tạo giá trị State của một cái Slice trong redux
const initialState = {
  currentActiveBoard: null
}

// Các hành động gọi api (bất đồng bộ) và cập nhật dữ liệu vào Redux, dùng Middleware createAsyncThunk di kèm với extraReducers
// https://redux-toolkit.js.org/api/createAsyncThunk
// Khởi tạo một cái Slice trong kho lưu trữ Redux Store
export const fecthBoardDetailsAPI = createAsyncThunk(
  'activeBoard/fecthBoardDetailsAPI',
  async (boardId) => {
    const response = await axios.get(`${API_ROOT}/v1/boards/${boardId}`)
    // Lưu ý: axios sẽ trả về qua property của nó là data
    return response.data
  }
)

// Khởi tạo một cái Slide trong kho lưu trữ - Redux Store
export const activeBoardSlice = createSlice({
  name: 'activeBoard',
  initialState,
  // Reducers: Nơi xử lý dữ liệu đồng bộ
  reducers: {
    // Lưu ý luôn là ở đây luôn luôn cần cặp ngoặc nhọn cho function trong reducer cho dù code bên trong chỉ có 1 dòng (updateCurrentActiveBoard: (state, action) => { logic } chứ không được updateCurrentActiveBoard: (state, action) => logic ) , đây là rule của Redux
    // https://redux-toolkit.js.org/usage/immer-reducers#mutating-and-returning-state
    updateCurrentActiveBoard: (state, action) => {
      // action.payload là chuẩn đặt tên nhận dữ liệu vào reducer, ở đây chúng tôi gán nó ra một biến có ý nghĩa hơn
      const board = action.payload

      // Xử lý dữ liệu nếu cần thiết...
      //...

      // Update lại dữ liệu của cái currentActibeBoard
      state.currentActiveBoard = board
    }
  },
  // ExtraReducers: Nơi xử lý dữ liệu bất đồng bộ
  extraReducers: (builder) => {
    builder.addCase(fecthBoardDetailsAPI.fulfilled, (state, action) => {
      // active.payload ở đây chính là cái response.data  trả về ở trên (fecthBoardDetailsAPI)
      let board = action.payload

      // Sắp xếp thứ tự các cards luôn ở đây trước khi đưa dữ liệu xuống bên dưới các component con (video 71 đã giải thích lý do ở phần fix bug quan trọng)
      board.column = mapOrder(board?.columns, board.columnOrderIds, '_id')

      board.columns.forEach(column => {
        // Khi F5 trang web thì cần xử lý vấn đề kéo thả vào một column rỗng (Nhớ lại video 37.2, code hiện tại là video 69)
        if (isEmpty(column.cards)) {
          column.cards = [generatePlaceholderCard(column)]
          column.cardOrderIds = [generatePlaceholderCard(column)._id]
        }
        else {
          // Sắp xếp thứ tự các cards luôn ở đây trước khi đưa dữ liệu xuống bên dưới các component con (video 71 đã giải thích lý do ở phần fix bug quan trọng)
          // Do mảng card trong column chưa được cập nhật lại vị trí index của card dù cardOrderIds đã được cập nhật, lỗi này chỉ xảy ra lần đầu tiên kéo thả card
          column.cards = mapOrder(column.cards, column.cardOrderIds, '_id')
        }
      })

      // Update lại dữ liệu của cái currentActibeBoard
      state.currentActiveBoard = board
    })
  }
})

// Action creators are generated for each case reducer function
// Actions: Là nơi dành cho các components bên dưới gọi bằng dispatch() tới nó để cập nhật lại dữ liệu thông qua reducer (chạy đồng bộ)
// Để ý ở trên thì không thấy properties actions đâu cả, bởi vì những cái actions này đơn giản là được thằng redux tạo tự động theo tên của reducer nhé.
export const { updateCurrentActiveBoard } = activeBoardSlice.actions

// Selectors: Là nơi dành cho các components bên dưới gọi bằng hook useSelector() để lầy dữ liệu từ trong kho redux store ra sử dụng
export const selectCurrentActiveBoard = (state) => {
  return state.activeBoard.currentActiveBoard
}

// Cái file này tên là activeBoardSlide NHƯNG chúng ta sẽ export một thứ tên là Reducer, mọi người lưu ý :D
// export default activeBoardSlice.reducer
export const activeBoardReducer = activeBoardSlice.reducer