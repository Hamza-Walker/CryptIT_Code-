import { InterfaceAbi, LogDescription } from "ethers";

export interface ResilientEventListenerArgs {
	rpcUrl: string;
	contractAddress: string;
	abi: InterfaceAbi;
	eventName: string;
	log?: (value: string, ...values: string[]) => void;
	callback?: (log: LogDescription | null) => void;
}
