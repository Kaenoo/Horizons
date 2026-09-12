import Button from './Button'
import Sheet from './Sheet'

export default function ConfirmSheet({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmer' }) {
  return (
    <Sheet open={open} onClose={onClose} title={title} icon="alert">
      <div className="flex flex-col gap-5">
        <p className="text-[14px] leading-relaxed text-subtle">{message}</p>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              onConfirm?.()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}