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
        "Glacial": 0.1, 
        "Plodding": 0.3,
        "Deliberate": 0.5,
        "Brisk": 0.7,
        "Rapid": 1
    }

    escalation: number = 0;
    maxEscalation: number = 100;
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
        this.maxEscalation = (config ? config.maxEscalation : null) ?? this.maxEscalation;

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
        this.escalation = Math.min(this.maxEscalation, this.escalation + this.pacing);
        console.log(`${this.escalation};${this.pacing};${this.maxEscalation}`)
        return {
            // In an ideal world, stage directions would trigger lorebooks, and then we would only ever have the most recent escalation tag per prompt.
            stageDirections: null, //`<!Escalation${Math.floor(this.escalation)}>`, 
            messageState: this.writeMessageState(),
            modifiedMessage: `<!Escalation${Math.floor(this.escalation)}>${content}`,
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
