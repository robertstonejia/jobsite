'use client'

import { useState, useCallback } from 'react'

interface DialogState {
  isOpen: boolean
  title: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning' | 'confirm'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
}

export function useDialog() {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  })

  const showDialog = useCallback((options: Omit<DialogState, 'isOpen'>) => {
    setDialog({
      ...options,
      isOpen: true
    })
  }, [])

  const showAlert = useCallback((message: string, title = '通知', type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setDialog({
      isOpen: true,
      title,
      message,
      type
    })
  }, [])

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    title = '確認',
    confirmText = 'はい',
    cancelText = 'いいえ'
  ) => {
    setDialog({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      confirmText,
      cancelText,
      onConfirm
    })
  }, [])

  const showSuccess = useCallback((message: string, title = '成功') => {
    showAlert(message, title, 'success')
  }, [showAlert])

  const showError = useCallback((message: string, title = 'エラー') => {
    showAlert(message, title, 'error')
  }, [showAlert])

  const showWarning = useCallback((message: string, title = '警告') => {
    showAlert(message, title, 'warning')
  }, [showAlert])

  const closeDialog = useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }, [])

  return {
    dialog,
    showDialog,
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    closeDialog
  }
}
