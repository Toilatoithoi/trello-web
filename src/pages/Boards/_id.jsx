import Container from '@mui/material/Container'
import AppBar from '~/components/AddBar/AddBar'
import BoardBar from './BoardBar/BoardBar'
import BoardContent from './BoardContent/BoardContent'
import { mockData } from '~/api/mock-data'

function Board() {
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
