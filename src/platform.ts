import type {
    AthleteState,
    OwlcmsAthlete,
    OwlcmsAthleteList,
} from './athlete';
import type {
    ClockState,
} from './clock';

import Athlete from './athlete';
import Clock from './clock';

export type Decision =
    | 'bad'
    | 'good';

export type Mode =
    | 'BEFORE_INTRODUCTION'
    | 'BEFORE_SESSION'
    | 'FIRST_CJ'
    | 'FIRST_SNATCH'
    | 'INTRODUCTION'
    | 'LIFTING'
    | 'MARSHAL'
    | 'TECHNICAL';

export interface PlatformState {
    athlete: AthleteState | null;
    athleteClock: ClockState;
    breakClock: ClockState;
    centerReferee: Decision | null;
    downSignal: boolean;
    leftReferee: Decision | null;
    mode: Mode | null;
    name: string;
    rightReferee: Decision | null;
    sessionDescription: string | null;
    sessionName: string | null;
}

export interface Session {
    description: string;
    name: string;
}

export default class Platform {
    private static platforms = new Map<string, Platform>();

    private athletes = new Map<number, Athlete>();

    private athleteClock: Clock;

    private breakClock: Clock;

    private centerReferee: Decision | null = null;

    private currentAthlete: Athlete | null = null;

    private currentSession: Session | null = null;

    private downSignal = false;

    private leftReferee: Decision | null = null;

    private liftingOrder: number[] = [];

    private mode: Mode = 'BEFORE_SESSION';

    private name: string;

    private rightReferee: Decision | null = null;

    public static getPlatform(name: string): Platform {
        let platform = this.platforms.get(name);

        if (!platform) {
            platform = new Platform({
                name,
            });

            this.platforms.set(name, platform);
        }

        return platform;
    }

    public constructor({
        name,
    }: {
        name: string;
    }) {
        this.athleteClock = new Clock();
        this.breakClock = new Clock();
        this.name = name;
    }

    public getAthleteClock(): Clock {
        return this.athleteClock;
    }

    public getBreakClock(): Clock {
        return this.breakClock;
    }

    public getCurrentAthlete(): Athlete | null {
        return this.currentAthlete || null;
    }

    public getLiftingOrder(): Athlete[] {
        return this.liftingOrder.map((startNumber) => {
            return this.athletes.get(startNumber) as Athlete;
        });
    }

    public getState(): PlatformState {
        return {
            athlete: this.currentAthlete?.getState() || null,
            athleteClock: this.athleteClock.getState(),
            breakClock: this.breakClock.getState(),
            centerReferee: this.centerReferee,
            downSignal: this.downSignal,
            leftReferee: this.leftReferee,
            mode: this.mode,
            name: this.name,
            rightReferee: this.rightReferee,
            sessionDescription: this.currentSession?.description || null,
            sessionName: this.currentSession?.name || null,
        };
    }

    public resetDecisions(): void {
        this.centerReferee = null;
        this.downSignal = false;
        this.leftReferee = null;
        this.rightReferee = null;
    }

    public setMode(mode: Mode): void {
        this.mode = mode;
    }

    public setCurrentAthlete(startNumber: number): void {
        this.currentAthlete = this.athletes.get(startNumber) || null;
    }

    public setDecisions({
        centerReferee,
        leftReferee,
        rightReferee,
    }: {
        centerReferee: Decision | null;
        leftReferee: Decision | null;
        rightReferee: Decision | null;
    }): void {
        this.downSignal = false;
        this.centerReferee = centerReferee;
        this.leftReferee = leftReferee;
        this.rightReferee = rightReferee;
    }

    public setDownSignal(state: boolean): void {
        this.downSignal = state;

        if (state) {
            this.centerReferee = null;
            this.leftReferee = null;
            this.rightReferee = null;
        }
    }

    public setSession(session: {
        description: string;
        name: string;
    }): void {
        this.currentSession = session;
    }

    private updateAthlete(data: OwlcmsAthlete): Athlete {
        const startNumber = parseInt(data.startNumber);
        let athlete = this.athletes.get(startNumber);

        if (!athlete) {
            athlete = new Athlete(data);
        } else {
            athlete.update(data);
        }

        this.athletes.set(startNumber, athlete);

        return athlete;
    }

    public updateAthletes(athletes: OwlcmsAthleteList): void {
        const realAthletes = athletes.filter((athlete) => {
            return !('isSpacer' in athlete);
        }) as OwlcmsAthlete[];

        this.liftingOrder = realAthletes.map((athleteData: OwlcmsAthlete) => {
            const athlete = this.updateAthlete(athleteData);

            return athlete.getState().startNumber;
        });
    }
}