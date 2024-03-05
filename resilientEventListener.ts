import { ResilientEventListenerArgs } from './interfaces/reslientEventListenerArgs';
import WebSocket from "isomorphic-ws";
import { abi } from './interfaces/abiExample';
import { connectToWebSocket } from './websocketUtils';
import { timeouts } from './websocketUtils';
/**
 * Creates a resilient event listener for a specified contract on an Ethereum Virtual Machine (EVM)-based network.
 * This listener uses a WebSocket connection to the EVM node specified by the rpcUrl.
 * It automatically reconnects in case of connection errors or closure.
 * 
 * @param {Object} args - The arguments for the event listener.
 * @param {string} args.rpcUrl - The URL of the EVM node to connect to.
 * @param {string} args.contractAddress - The address of the contract to listen to.
 * @param {InterfaceAbi} args.abi - The ABI (Application Binary Interface) of the contract.
 * @param {string} args.eventName - The name of the event to listen for.
 * @param {Function} [args.log] - An optional logging function. If provided, it will be called with log messages.
 * @param {Function} [args.callback] - An optional callback function. If provided, it will be called with the parsed log data whenever an event is received.
 * 
 * @returns {Object} An object containing a `stop` function that can be called to stop the event listener.
 */


const exampleArgs: ResilientEventListenerArgs = {
    rpcUrl: 'ws://example.com', 
    contractAddress: '0x123456789...', 
    abi: abi, 
    eventName: 'YourEventName',
    log: console.log, 
    callback: (logData) => {
        console.log('Received event:', logData);
    }
};
function resilientEventListener(args: ResilientEventListenerArgs) {
    const ws = new WebSocket(args.rpcUrl);

    const connect = () => {
        connectToWebSocket(ws, args);
    };

    const stop = () => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
        if (timeouts.keepAlive) clearInterval(timeouts.keepAlive);
        if (timeouts.ping) clearTimeout(timeouts.ping);
    };

    return { connect, stop };
}



const eventListener = resilientEventListener(exampleArgs);
eventListener.connect();

