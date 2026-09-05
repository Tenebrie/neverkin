import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useAutoRef } from '@/app/hooks/useAutoRef'
import { isRunningInTest } from '@/test-utils/isRunningInTest'
import { CalliopeToClientMessage } from '@/ts-shared/CalliopeToClientMessage'
import { ClientToCalliopeMessage, ClientToCalliopeMessageType } from '@/ts-shared/ClientToCalliopeMessage'

import { authSlice } from '../../auth/AuthSlice'
import { getAuthState } from '../../auth/AuthSliceSelectors'
import { useEventBusDispatch, useEventBusSubscribe } from '../../eventBus'
import { useLiveMessageHandlers } from './useLiveMessageHandlers'

const expBackoffDelays = [50, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]
const CONNECTION_ALERT_DELAY_MS = 3000

export const useLiveUpdates = () => {
	const { sessionId, user } = useSelector(getAuthState)

	const currentWebsocket = useRef<WebSocket | null>(null)
	const heartbeatInterval = useRef<number | null>(null)
	const connectionAlertTimeout = useRef<number | null>(null)
	const backoffLevel = useRef<number>(-1)
	useEventBusSubscribe['calliope/requestSendMessage']({
		callback: (message) => {
			if (currentWebsocket.current?.readyState === WebSocket.OPEN) {
				currentWebsocket.current?.send(JSON.stringify(message))
			}
		},
	})
	const notifyAboutReconnect = useEventBusDispatch['calliope/onReconnected']()

	const { showCalliopeConnectionAlert, hideCalliopeConnectionAlert } = authSlice.actions
	const dispatch = useDispatch()

	const messageHandlers = useLiveMessageHandlers()

	const clearHeartbeat = useCallback(() => {
		if (heartbeatInterval.current !== null) {
			window.clearInterval(heartbeatInterval.current)
		}
	}, [])

	const userRef = useAutoRef(user)

	const { initiateConnection } = useMemo(() => {
		const reconnect = () => {
			backoffLevel.current += 1
			const delay = expBackoffDelays[backoffLevel.current] ?? 10000
			console.info(`[ws] Waiting ${delay}ms before attempting to reconnect...`)
			setTimeout(() => {
				initiateConnection()
			}, delay)
		}

		const initiateConnection = () => {
			if (isRunningInTest()) {
				return
			}

			if (
				currentWebsocket.current &&
				(currentWebsocket.current.readyState === currentWebsocket.current.CONNECTING ||
					currentWebsocket.current.readyState === currentWebsocket.current.OPEN)
			) {
				return
			}

			if (!userRef.current) {
				return
			}

			const protocol = window.location.protocol === 'http:' ? 'ws:' : 'wss:'
			const socket = new WebSocket(`${protocol}//${window.location.host}/live/${sessionId}`)

			console.info(`[ws] Attempting connection to ${socket.url}...`)
			clearHeartbeat()

			heartbeatInterval.current = window.setInterval(() => {
				if (currentWebsocket.current?.readyState !== WebSocket.OPEN) {
					return
				}
				const message: ClientToCalliopeMessage = {
					type: ClientToCalliopeMessageType.KEEPALIVE,
					data: {},
				}
				socket.send(JSON.stringify(message))
			}, 15000)

			socket.onopen = function () {
				console.info('[ws] Connection established!')
				if (connectionAlertTimeout.current !== null) {
					window.clearTimeout(connectionAlertTimeout.current)
					connectionAlertTimeout.current = null
				}
				dispatch(hideCalliopeConnectionAlert())
				const message: ClientToCalliopeMessage = {
					type: ClientToCalliopeMessageType.INIT,
					data: {},
				}
				socket.send(JSON.stringify(message))
				backoffLevel.current = -1
				notifyAboutReconnect()
			}

			socket.onmessage = function (event) {
				const message = JSON.parse(event.data) as CalliopeToClientMessage
				console.debug('[ws] Received message:', message)
				// TODO: The data is guaranteed to be correct, but fix typings
				if (messageHandlers.current) {
					messageHandlers.current[message.type](message.data as never)
				}
			}

			socket.onclose = function (event) {
				if (event.wasClean) {
					console.info(`[ws] Connection closed cleanly, code=${event.code} reason=${event.reason}`)
				} else {
					console.error('[ws] Connection lost. Reconnecting...')
				}
				clearHeartbeat()
				if (userRef.current) {
					if (connectionAlertTimeout.current === null) {
						connectionAlertTimeout.current = window.setTimeout(() => {
							connectionAlertTimeout.current = null
							dispatch(showCalliopeConnectionAlert())
						}, CONNECTION_ALERT_DELAY_MS)
					}
					reconnect()
				}
			}

			socket.onerror = function (error) {
				console.error(`[ws]`, error)
			}

			currentWebsocket.current = socket
		}

		return { initiateConnection }
	}, [
		clearHeartbeat,
		dispatch,
		hideCalliopeConnectionAlert,
		messageHandlers,
		notifyAboutReconnect,
		sessionId,
		showCalliopeConnectionAlert,
		userRef,
	])

	useEffect(() => {
		if (!sessionId || !user) {
			return
		}
		initiateConnection()
	}, [initiateConnection, sessionId, user])

	useEffect(() => {
		if (currentWebsocket.current && !user) {
			currentWebsocket.current.close()
		}
	}, [user])
}
