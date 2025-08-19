import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import Popover from '@mui/material/Popover'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'
import { FIELD_REQUIRED_MESSAGE, EMAIL_RULE, EMAIL_RULE_MESSAGE } from '~/utils/validators'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import { inviteUserToBoardAPI } from '~/apis'
import { socketIoInstance } from '~/main'

function InviteBoardUser({ boardId }) {
  /**
* Xử lý Popover để ần hoặc hiện một popup nhỏ, tương tự docs để tham khảo ở đây:
* https://mui.com/material-ui/react-popover/
*/
  const [anchorPopoverElement, setAnchorPopoverElement] = useState(null)
  const isOpenPopover = Boolean(anchorPopoverElement)
  const popoverId = isOpenPopover ? 'invite-board-user-popover' : undefined
  const handleTogglePopover = (event) => {
    if (!anchorPopoverElement) setAnchorPopoverElement(event.currentTarget)
    else setAnchorPopoverElement(null)
  }
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()
  const submitInviteUserToBoard = (data) => {
    const { inviteeEmail } = data

    // console.log('inviteeEmail:', inviteeEmail)
    // Gọi API mời một người dùng nào đó vào làm thành viên của Board
    inviteUserToBoardAPI({ inviteeEmail, boardId }).then((invitation) => {
      // Clear the input sử dụng react-hook-form bằng setValue, đống thời đóng popover lại
      setValue('inviteeEmail', null)
      setAnchorPopoverElement(null)

      // Mời một người dùng vào board xong thì cũng sẽ gửi/emít sự kiện socket lên server (tính năng real-time) > FE_USER_INVITED_TO_BOARD
      socketIoInstance.emit('FE_USER_INVITED_TO_BOARD', invitation)
    })
  }

  return (
    <Box>
      <Tooltip title="Invite user to this board!">
        <Button
          aria-describedby={popoverId}
          onClick={handleTogglePopover}
          variant="outlined"
          startIcon={<PersonAddIcon />}
          sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white' } }}
        >
          Invite
        </Button>
      </Tooltip>

      {/* Khi click vào button Invite ở trên thì sẽ mở popoverD */}
      <Popover
        id={popoverId}
        open={isOpenPopover}
        anchorEl={anchorPopoverElement}
        onClose={handleTogglePopover}
        anchor0rigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <form onSubmit={handleSubmit(submitInviteUserToBoard)} style={{ width: '320px' }}>
          <Box sx={{ p: '15px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="span" sx={{ fontWeight: 'bold', fontSize: '16px' }}>Invite User To This Board!</Typography>
            <Box>
              <TextField
                autoFocus
                fullWidth
                label="Enter email to invite..."
                type="text"
                variant="outlined"
                {...register('inviteeEmail', {
                  required: FIELD_REQUIRED_MESSAGE,
                  pattern: { value: EMAIL_RULE, message: EMAIL_RULE_MESSAGE }
                })}
                error={!!errors['inviteeEmail']}
              />
              <FieldErrorAlert errors={errors} fieldName={'inviteeEmail'} />
            </Box>
            <Box sx={{ alignSelf: 'flex-end' }}>
              <Button
                className="interceptor-loading"
                type="submit"
                variant="contained"
                color="info"
              >
                Invite
              </Button>
            </Box>
          </Box>
        </form>
      </Popover>
    </Box >
  )
}

export default InviteBoardUser