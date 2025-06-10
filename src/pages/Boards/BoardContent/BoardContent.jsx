import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'
import {
  DndContext,
  // PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import Column from './ListColumns/Column/Column'
import Card from './ListColumns/Column/ListCards/Card/Card'

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

function BoardContent({ board }) {
  // Nếu dùng PointerSensor mặc định thì phải kết hợp thuộc tính CSS touch-action: none ở những phần tử kéo thả - nhưng mà con bug ưu tiên sử dụng mouseSensor và touchSensor
  // const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } })

  // Yêu cầu chuột di chuyển 10px thì mới kích hoạt event, fix trường hợp chỉ mới click đã bị gọi event
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 10 } })

  // Nhấn giữ 250ms và dung sai của cảm ứng (dễ hiểu là di chuyển/chênh lệch 500px) thì mới kích hoạt event
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 500 } })

  // Ưu tiên sử dụng kết hợp 2 loại sensors là mouse và touch để nó trải nghiệm trên mobile tốt nhất, không bị bug
  // const sensors = useSensors(pointerSensor)
  const sensors = useSensors(mouseSensor, touchSensor)

  const [orderColumnsState, setOrderColumnsState] = useState([])

  // Cùng một thời điểm chỉ có một phần tử đang được kéo (column hoặc card)
  const [activeDragIyemId, setActiveDragItemId] = useState(null)
  const [activeDragIyemType, setActiveDragItemType] = useState(null)
  const [activeDragIyemData, setActiveDragItemData] = useState(null)

  useEffect(() => {
    const orderColumns = mapOrder(board?.columns, board.columnOrderIds, '_id')
    setOrderColumnsState(orderColumns)
  }, [board])

  // Trigger khi bắt đầu kéo (drag) một phần tử
  const handleDragStart = (event) => {
    setActiveDragItemId(event?.active?.id)
    setActiveDragItemType(event?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN)
    setActiveDragItemData(event?.active?.data?.current)
  }

  // Trigger khi kết thúc một hành động kéo (drag) một phần tử => hành động thả (drop)
  const handleDragEnd = (event) => {
    const { active, over } = event

    // Kiểm tra nếu không tồn tại over (kéo linh tinh ra ngoài thì return luôn tránh lỗi)
    if (!over) return

    // Nếu vị trí sau khi kéo thả khác với vị trí ban đầu
    if (active.id !== over.id) {
      // lấy vị trí cũ từ thằng active
      const oldIndex = orderColumnsState.findIndex(c => c._id === active.id)
      // lấy vị trí mới từ thằng over
      const newIndex = orderColumnsState.findIndex(c => c._id === over.id)
      // biến đổi bảng mới
      // Dùng arrayMove của dnd-kit để sắp xếp lại mảng Columns ban đầu
      const dndOrderColumns = arrayMove(orderColumnsState, oldIndex, newIndex)
      // Dùng để lưu dữ liệu columnOrderIds vào database (xử lý gọi API)
      // const dndOrderColumnsIds = dndOrderColumns.map(c => c._id)
      // Cập nhật lại state columns ban đầu sau khi đã kéo thả
      setOrderColumnsState(dndOrderColumns)
    }

    setActiveDragItemId(null)
    setActiveDragItemType(null)
    setActiveDragItemData(null)
  }

  /**
   *  Animation khi thả (Drop) phần tử - Test bằng cách kéo xong thả trực tiếp và nhìn phần tử giữ chỗ Overlap
   * (Video 32)
   */
  const customDropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5'
        }
      }
    })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}>
      <Box sx={{
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'),
        width: '100%',
        height: (theme) => theme.trello.boardContentHeight,
        p: '10px 0'
      }}
      >
        <ListColumns columns={orderColumnsState} />
        <DragOverlay dropAnimation={customDropAnimation}>
          {!activeDragIyemType && null}
          {(activeDragIyemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) && <Column column={activeDragIyemData} />}
          {(activeDragIyemType === ACTIVE_DRAG_ITEM_TYPE.CARD) && <Card card={activeDragIyemData} />}
        </DragOverlay>
      </Box>
    </DndContext>
  )
}

export default BoardContent
