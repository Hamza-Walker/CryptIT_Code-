import { ResilientEventListenerArgs } from './interfaces/reslientEventListenerArgs';
import { abi } from './interfaces/abi';
import { setupWebSocket } from './websocketUtils';
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

const args: ResilientEventListenerArgs = {
    rpcUrl: 'ws://example.com', // Provide your RPC URL here
    contractAddress: '0x123456789...', // Provide your contract address here
    abi: abi, // Provide your contract ABI here
    eventName: 'YourEventName', // Provide the name of the event to listen for
    log: console.log, // Optionally, you can provide a logging function
    callback: (logData) => {
        // Optionally, you can provide a callback function to handle received events
        console.log('Received event:', logData);
    }
};

function resilientEventListener (args: ResilientEventListenerArgs) {
// TODO: Setup websocket connection
	const connect = () => {
	setupWebSocket(args);	
	}
	connect();

// TODO: Stop websocket connection
	const stop = () => {
	}

	return  {stop} 
}

resilientEventListener(args);

