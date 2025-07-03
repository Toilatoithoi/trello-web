import { useEffect, useState } from 'react'
import Container from '@mui/material/Container'
import AppBar from '~/components/AddBar/AddBar'
import BoardBar from './BoardBar/BoardBar'
import BoardContent from './BoardContent/BoardContent'
import { mockData } from '~/api/mock-data'
import { fecthBoardDetailsAPI } from '~/api'

function Board() {
  const [board, setBoard] = useState(null)

  useEffect(() => {
    // Tạm thời fix cứng boardId flow chuẩn chỉnh về sai khi học khoá nâng cao trực tiếp với mình là chúng ta sẽ sử dụng react-dom để lấy chuẩn boardId từ URL về
    const boardId = '6862bc9b05d187d673fa41dc'
    // Call API
    // Nếu 1 biến thì không cần (board) chỉ cần board
    fecthBoardDetailsAPI(boardId).then(board => {
      setBoard(board)
    })
  }, [])

  return (
    <>
      <Container disableGutters maxWidth={false} sx={{ height: '100vh' }}>
        <AppBar />
        <BoardBar board={mockData?.board} />
        <BoardContent board={mockData?.board} />
      </ Container>
    </>
  )
}

export default Board
