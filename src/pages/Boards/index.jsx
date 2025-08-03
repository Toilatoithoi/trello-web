// Boards list
import { useEffect, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import PageLoadingSpinner from '~/components/PageLoading/PageLoadingSpinner'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
// Grid: https://mui.com/material-ui/react-grid2/#whats-changed
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard'
import ListAltIcon from '@mui/icons-material/ListAlt'
import HomeIcon from '@mui/icons-material/Home'
import ArrowkRightIcon from '@mui/icons-material/ArrowRight'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Pagination from '@mui/material/Pagination'
import PaginationItem from '@mui/material/PaginationItem'
import { Link, useLocation } from 'react-router-dom'
import randomColor from 'randomcolor'
import SidebarCreateBoardModal from './create'


import { styled } from '@mui/material/styles'
const SidebarItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  padding: '12px 16px',
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#33485D' : theme.palette.grey[300]
  },
  '&.active': {
    color: theme.palette.mode === 'dark' ? '#90caf9' : '#0c66e4',
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#e9f2ff'
  }
}))

function Boards() {
  const [boards, setBoards] = useState(null)

  // Xử lý phân trang từ url với MUI: https://mui.com/material-ui/react-pagination/#router-integration
  const location = useLocation()
  /**
   * Parse chuỗi string search trong location về đối tượng URLSearchParams trong JavaScript
   * https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams
  */
  const query = new URLSearchParams(location.search)
  /**
    * Lấy giá trị page từ query, default sẽ là 1 nếu không tồn tại page từ url.
    * Nhắc lại kiến thức cơ bản hàm parseInt cần tham số thứ 2 là Hệ thập phân(hệ đếm cơ số 10) để đảm bảo chuẩn số cho phân trang
  */

  const page = parseInt(query.get('page') || '1', 10)

  useEffect(() => {
    // Fake tamj 16 cais item thay cho boards
    // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    setBoards([...Array(16)].map((_, i) => i))

    // Gọi API lấy danh sách boards ở đây...
    // ...
  }, [])

  if (!boards) {
    return <PageLoadingSpinner caption="Loading Boards..." />
  }

  return (
    <Container disableGutters maxWidth={false}>
      <AppBar />
      <Box sx={{ paddingX: 2, my: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Stack direction="column" spacing={1}>
              <SidebarItem className="active">
                <SpaceDashboardIcon fontSize="small" />
                Boards
              </SidebarItem>
              <SidebarItem>
                <ListAltIcon fontSize="small" />
                Templates
              </SidebarItem>
              <SidebarItem>
                <HomeIcon fontSize="small" />
                Home
              </SidebarItem>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="column" spacing={1}>
              <SidebarCreateBoardModal />
            </Stack>
          </Grid>

          <Grid item xs={12} sm={9}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Your boards:</Typography>

            {boards?.length === 0 &&
              <Typography variant="span" sx={{ fontWeight: 'bold', mb: 3 }}>No result found!</Typography>
            }

            <Grid container spacing={2} sx={{ pr: 4 }}>
              {boards.map(b => (
                <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={b}>
                  <Card sx={{ width: '100%' }}>
                    <Box sx={{ height: '50px', backgroundColor: randomColor() }} />
                    <CardContent sx={{ p: 1.5 }}>
                      <Typography variant="h6" gutterBottom>Board title</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        This impressive paella is a perfect party dish...
                      </Typography>
                      <Box
                        component={Link}
                        to={'boards/6862bc9b05d187d673fa41dc'}
                        sx={{
                          mt: 1,
                          display: 'flex',
                          justifyContent: 'flex-end',
                          color: 'primary.main',
                          '&:hover': { color: 'primary.light' }
                        }}>
                        Go to board <ArrowkRightIcon fontSize="small" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>


            <Box sx={{ my: 3, pr: 5, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Pagination
                size="large"
                color="secondary"
                showFirstButton
                showLastButton
                count={boards.length}
                page={page}
                renderItem={(item) => (
                  <PaginationItem
                    component={Link}
                    to={`/boards${item.page === 1 ? '' : `?page=${item.page}`}`}
                    {...item}
                  />
                )}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default Boards