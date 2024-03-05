import {
	DEFAULT_KEEP_ALIVE_INTERVAL_MS,
	ONE_SECOND,
	PING_TIMEOUT_DURATION_MS,
} from "./constants";

import { Contract } from "ethers";
import { ResilientEventListenerArgs } from "./interfaces/reslientEventListenerArgs";
import WebSocket from "isomorphic-ws";
import { WebSocketRequest } from "./interfaces/webSocketRequest";

export const timeouts = {
	ping: null as ReturnType<typeof setTimeout> | null,
	keepAlive: null as ReturnType<typeof setInterval> | null,
	reconnect: null as ReturnType<typeof setTimeout> | null,
};

export const setupWebSocket = (args: ResilientEventListenerArgs) => {
	// TODO: Setup websocket connection
	const ws = new WebSocket(args.rpcUrl);

	ws.onopen = handleWebSocketOpen(args, ws);
	ws.onmessage = handleWebSocketMessage(args, event);
	ws.onerror = (error: ErrorEvent) => handleError(args, error);
	ws.onclose = handleWebSocketClose(args);
};
const handleWebSocketMessage = (args: ResilientEventListenerArgs, event: any ) => {
	const ping = buildPingMessage();
	const request = builSubscriptionRequest(args);
	let parsedData;
	let subscriptionId; 

	if (typeof event.data === "string") {
		parsedData = JSON.parse(event.data);
	} else if (event.data instanceof ArrayBuffer) {
		const dataString = new TextDecoder().decode(event.data);
		parsedData = JSON.parse(dataString);
	}

	if (parsedData) {
		if (parsedData.id === request.id) {
			handleSubscriptionResponse(args, parsedData, subscriptionId);
		} else if (parsedData.id === ping.id && parsedData.result === true) {
			handlePingResponse();
		} else if (
			parsedData.method === "eth_subscription" &&
			parsedData.params.subscription === subscriptionId
		) {
			handleSubscriptionEvent(args, parsedData);
		}
	}
};

function handleSubscriptionResponse(args: ResilientEventListenerArgs, parsedData: any, subscriptionId: any) {
    subscriptionId = parsedData.result;
    args.log && args.log(`[${getCurrentDateTimeString()}] Subscription to event '${args.eventName}' established with subscription ID '${parsedData.result}'.`);
}

function handlePingResponse() {
    args.log && args.log(`[${getCurrentDateTimeString()}] Health check complete, subscription to '${args.eventName}' is still active.`);
    if (timeouts.ping) clearInterval(timeouts.ping);
}

function handleSubscriptionEvent(args : ResilientEventListenerArgs, parsedData: any) {
    const log = parsedData.params.result;
    const contract = new Contract(args.contractAddress, args.abi); // not sure about the implications of creating two instances of the same contract 
    const event = contract.interface.parseLog(log);
    args.log && args.log(`[${getCurrentDateTimeString()}] Received event ${event?.name}: ${event?.args}`);
    args.callback && args.callback(event);
}

const handleWebSocketOpen = (
	args: ResilientEventListenerArgs,
	ws: WebSocket,
) => {
	const request: WebSocketRequest = builSubscriptionRequest(args);
	sendWebSocketMessage(ws, request);
	args.log &&
		args.log(`WebSocket connection opened at ${getCurrentDateTimeString()}`);
	startKeppAliveMechanism(ws, args);
};

const handleWebSocketClose = (args: ResilientEventListenerArgs) => {
	args.log && args.log(`[${getCurrentDateTimeString()}] WebSocket closed`);

	if (timeouts.ping) clearTimeout(timeouts.ping);
	if (timeouts.keepAlive) clearInterval(timeouts.keepAlive);
	if (timeouts.reconnect) clearTimeout(timeouts.reconnect);

	// Reconnect when the connection is closed
	timeouts.reconnect = setTimeout(() => {
		setupWebSocket(args);
	}, ONE_SECOND);
};

const handleError = (args: ResilientEventListenerArgs, error: ErrorEvent) => {
	args.log &&
		args.log(
			`[${getCurrentDateTimeString()}] WebSocket connection error: ${error}`,
		);
};

const builSubscriptionRequest = (args: ResilientEventListenerArgs) => {
	const contract = new Contract(args.contractAddress, args.abi);
	const topicHash = contract.getEvent(args.eventName).getFragment().topicHash;
	return {
		id: 1,
		method: "eth_subscribe",
		params: [
			"logs",
			{
				topics: [topicHash],
				address: args.contractAddress,
			},
		],
	};
};

const sendWebSocketMessage = (ws: WebSocket, message: WebSocketRequest) => {
	if (ws.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify(message));
	} else {
		console.error("WebSocket is not open. Unable to send message.");
	}
};

const startKeppAliveMechanism = (
	ws: WebSocket,
	args: ResilientEventListenerArgs,
) => {
	timeouts.keepAlive = setInterval(() => {
		if (ws.readyState !== WebSocket.OPEN) {
			args.log &&
				args.log(
					`[${getCurrentDateTimeString()}] No connected websocket, exiting keep alive interval`,
				);
			if (timeouts.keepAlive !== null) {
				clearInterval(timeouts.keepAlive);
			}
		}
		args.log &&
			args.log(
				`[${getCurrentDateTimeString()}] Performing health check on the Web Socket RPC, to maintain subscription to '${args.eventName}'.`,
			);
		const pingMessage: WebSocketRequest = buildPingMessage();
		sendWebSocketMessage(ws, pingMessage);

		// Set timeout to terminate connection if pong is not received
		timeouts.ping = setTimeout(() => {
			if (ws.readyState === WebSocket.OPEN) {
				args.log &&
					args.log(
						`[${getCurrentDateTimeString()}] Ping timeout, terminating websocket connection`,
					);
				ws.terminate();
			}
		}, PING_TIMEOUT_DURATION_MS);

		// Clear the timeout when pong is received
		ws.onmessage = () => {
			if (timeouts.ping !== null) clearTimeout(timeouts.ping);
		};
	}, DEFAULT_KEEP_ALIVE_INTERVAL_MS);
};

const buildPingMessage = () => {
	return {
		id: 2,
		method: "net_listening",
		params: [],
	};
};

function getCurrentDateTimeString() {
	return new Date().toISOString();
}