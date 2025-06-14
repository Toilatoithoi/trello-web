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
  defaultDropAnimationSideEffects,
  closestCorners
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import Column from './ListColumns/Column/Column'
import Card from './ListColumns/Column/ListCards/Card/Card'
import { cloneDeep } from 'lodash'

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

  // Tìm một cái Column theo CardId
  const findColumnByCardId = (cardId) => {
    // Đoạn này cần lưu ý, nên dùng c.cards thay vì c.cardOrderIds bởi vì ở bước handleDragOver chúng ta sẽ làm dữ liệu cho cards hoàn chỉnh trước rồi mới tạo ra cardOverIds mới
    return orderColumnsState.find(column => column.cards.map(card => card._id)?.includes(cardId))
  }

  // Trigger khi bắt đầu kéo (drag) một phần tử
  const handleDragStart = (event) => {
    setActiveDragItemId(event?.active?.id)
    setActiveDragItemType(event?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN)
    setActiveDragItemData(event?.active?.data?.current)
  }

  // Trigger trong quá trình kéo (drag) một phần tử
  const handleDragOver = (event) => {
    // Không làm gì thêm nếu kéo column
    if (activeDragIyemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      return
    }

    // Còn nếu kéo card thì xử lý thêm để có thể kéo card qua lại giữa các
    console.log('handleDragOver: ', event)
    const { active, over } = event

    // Cần đảm bảo nếu không tồm tại active hoặc over (khi kéo ra khỏi phạm vi container) thì không làm gì cả (tránh crash trang)
    if (!active || !over) return

    // activeDraggingCard: là cái card đang được kéo
    const { id: activeDraggingCardId, data : { current: activeDraggingCard } } = active
    // overCard: là cái card đang tương tác trên hoặc dưới so với cái card được kéo ở trên.
    const { id: overCardId } = over

    // Tìm 2 cái columns theo cardId
    const activeColumn = findColumnByCardId(activeDraggingCardId)
    const overColumn = findColumnByCardId(overCardId)

    // Nếu không tồn tại 1 trong 2 column thì không làm gì hết,  tránh crash trang web
    if (!activeColumn || !overColumn) return

    // Xử lý logic ở đây chỉ khi kéo card qua 2 column khác nhau, còn nếu kéo card trong chính column ban đầu của nó thì không làm gì cả
    // Vì đây đang là đoạn xử lý lúc kéo (handleDragOver), còn xử lý lúc kéo xong xuôi thì nó lại là vấn đề khác ở (handleDragEnd)
    if (activeColumn._id !== overColumn._id) {
      setOrderColumnsState(preColumns => {
        // Tìm vị trí (index) của cái overCard trong column đích (nơi mà activeCard sắp được thả)
        const overCardIndex = overColumn?.cards?.findIndex(card => card._id === overCardId)

        // Logic tính toán "cardIndex mới" (trên hoặc dưới của overCard) lấy chuẩn ra từ code của thư viện
        let newCardIndex
        const isBelowOverItem = active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height
        const modifier = isBelowOverItem ? 1 : 0
        newCardIndex = overCardIndex >= 0 ? overCardIndex + modifier : overColumn?.cards?.length + 1

        // Clone mảng OrderColumnState cũ ra một mảng mới để xử lý data rồi return - cập nhtaaj lại OrderColumnState mới
        const nextColumns = cloneDeep(preColumns)
        const nextActiveColumn = nextColumns.find(column => column._id === activeColumn._id)
        const nextOverColumn = nextColumns.find(column => column._id === overColumn._id)

        // Active column là column cũ
        if (nextActiveColumn) {
          // Xoá card ở cái column active (cũng có thể hiển là column cũ, cái lúc mà kéo card khỏi nó để sang column khác)
          nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card._id !== activeDraggingCardId)

          // Cập nhật lại mảng cardOrderIds cho chuẩn bị dữ liệu
          nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(card => card._id)
        }

        // Over column là column mới
        if (nextOverColumn) {
          // Kiểm tra xem card đang kéo nó có tồn tại ở overColumn chưa, nếu có thì cần xoá nó trước
          nextOverColumn.cards = nextOverColumn.cards.filter(card => card._id !== activeDraggingCardId)

          // Tiếp theo là thêm cái card đang kéo vào overColumn theo vị trị index mới
          nextOverColumn.cards = nextOverColumn.cards.toSpliced(newCardIndex, 0, activeDraggingCard)

          // Cập nhật lại mảng cardOrderIds cho chuẩn bị dữ liệu
          nextOverColumn.cardOrderIds = nextOverColumn.cards.map(card => card._id)
        }

        console.log('nextColumns: ', nextColumns)

        return nextColumns
      })
    }
  }

  // Trigger khi kết thúc một hành động kéo (drag) một phần tử => hành động thả (drop)
  const handleDragEnd = (event) => {
    if (activeDragIyemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      return
    }

    const { active, over } = event

    // Cần đảm bảo nếu không tồm tại active hoặc over (khi kéo ra khỏi phạm vi container) thì không làm gì cả (tránh crash trang)
    if (!active || !over) return

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
      // Cảm biến (đã giải thích kỹ ở video số 30)
      sensors={sensors}
      // Thuật toán phát hiện va chạm (nếu không có nó thì card với cover lớn sẽ không kéo qua column được vì lúc này nó bị conflict giữa card và column)
      // Chúng ta sẽ dùng closetCorners thay vì closestCenter
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
