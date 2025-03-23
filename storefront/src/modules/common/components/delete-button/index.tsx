"use client"

import { useState } from "react"
import { deleteLineItem } from "@lib/data/cart"
import { Icon } from "@/components/Icon"

const DeleteButton = ({ id }: { id: string }) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    await deleteLineItem(id).catch(() => {
      setIsDeleting(false)
    })
  }

  return (
    <button
      type="button"
      onClick={() => handleDelete(id)}
      disabled={isDeleting}
      className="p-1"
      aria-label="Delete"
    >
      <Icon name="trash" className="w-4 h-4 sm:w-6 sm:h-6" />
    </button>
  )
}

export default DeleteButton
