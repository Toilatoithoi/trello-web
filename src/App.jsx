//khi làm next.js hay nhưng framework dùng ssr thì để ngăn chặn dark-mode flickering phải dùng import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
//Link đọc: https://v5.mui.com/material-ui/experimental-api/css-theme-variables/migration/
import Board from '~/pages/Boards/_id'

function App() {

  return (
    <>
      {/* React Router Dom / boards / boards/{board_id}*/}
      {/* Board Details*/}
      <Board />
    </>
  )
}

export default App
