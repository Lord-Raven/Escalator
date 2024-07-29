import {ReactElement} from "react";
import {StageBase, StageResponse, InitialData, Message} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";

type MessageStateType = any;

type ConfigType = any;

type InitStateType = any;

type ChatStateType = any;

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    readonly defaultPacing: string = 'Deliberate';

    readonly pacingMap: {[key: string]: number} = {
        "Glacial": 1, 
        "Plodding": 3,
        "Deliberate": 5,
        "Brisk": 7,
        "Harrowing": 9
    }

    escalation: number = 0;
    pacing: number;

    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
        super(data);
        const {
            characters,
            users,
            config,
            messageState,
            environment,
            initState,
            chatState
        } = data;

        this.pacing = (config ? this.pacingMap[config.pacing] : null) ?? this.pacingMap[this.defaultPacing];

        this.readMessageState(messageState);
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {

        return {
            success: true,
            error: null,
            initState: null,
            chatState: null,
        };
    }

    async setState(state: MessageStateType): Promise<void> {
        this.readMessageState(state);
    }

    readMessageState(messageState: MessageStateType) {
        if (messageState != null) {
            this.escalation = messageState.escalation;
        }
    }

    writeMessageState() {
        return {escalation: this.escalation};
    }

    async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        const {
            content
        } = userMessage;
        this.escalation += this.pacing;
        return {
            stageDirections: `[Escalation${Math.floor(this.escalation / 5) * 5}]`,
            messageState: this.writeMessageState(),
            modifiedMessage: `${content}<!Escalation${Math.floor(this.escalation / 5) * 5}>`,
            systemMessage: null,
            error: null,
            chatState: null,
        };
    }

    async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        return {
            stageDirections: null,
            messageState: this.writeMessageState(),
            modifiedMessage: null,
            error: null,
            systemMessage: null,
            chatState: null
        };
    }

    render(): ReactElement {
        return <div></div>;
    }

}
