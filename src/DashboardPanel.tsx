// SPDX-License-Identifier: GPL-3.0-or-later

import { invoke } from "@tauri-apps/api/tauri";
import { For, Show } from "solid-js";
import {
    GET,
    SET,
    BT,
    AppStatus,
    RoastEventId,
    appStateSig,
    resetChannels,
    RoastEvent,
    Channel,
    resetNotes,
} from "./AppState";
import { calculatePhases, timestamp_format } from "./calculate";
import WorkerFactory from "./WorkerFactory";
import timerWorker from "./timer.worker";
import RangeInput from "./RangeInput";
import PhaseChart from "./PhaseChart";

const [appState, _setAppState] = appStateSig;
const [status, setStatus] = appState().statusSig;
const [timer, setTimer] = appState().timerSig;
const [channelArr, _setChannelArr] = appState().channelArrSig;
const [logArr, setLogArr] = appState().logArrSig;
const [roastEvents, setRoastEvents] = appState().roastEventsSig;
const [manualChannelArr, _setManualChannelArr] = appState().manualChannelArrSig;
const [dryingPhase, setDryingPhase] = appState().dryingPhaseSig;
const [maillardPhase, setMaillardPhase] = appState().maillardPhaseSig;
const [developPhase, setDevelopPhase] = appState().developPhaseSig;
const [ghost, _setGhost] = appState().ghostSig;
const bt = channelArr().find((c) => c.id == BT) as Channel;
let timer_worker: Worker;

export function handleCharge() {
    setRoastEvents({
        ...roastEvents(),
        CHARGE: new RoastEvent(
            RoastEventId.CHARGE,
            timer(),
            bt.currentDataSig[GET]()
        ),
    });
    appState().timeDeltaSig[SET](-timer());
}

export function handleDryEnd() {
    setRoastEvents({
        ...roastEvents(),
        DRY_END: new RoastEvent(
            RoastEventId.DRY_END,
            timer(),
            bt.currentDataSig[GET]()
        ),
    });
}

export function handleFCStart() {
    setRoastEvents({
        ...roastEvents(),
        FC_START: new RoastEvent(
            RoastEventId.FC_START,
            timer(),
            bt.currentDataSig[GET]()
        ),
    });
}

export function handleFCEnd() {
    setRoastEvents({
        ...roastEvents(),
        FC_END: new RoastEvent(
            RoastEventId.FC_END,
            timer(),
            bt.currentDataSig[GET]()
        ),
    });
}

export function handleSCStart() {
    setRoastEvents({
        ...roastEvents(),
        SC_START: new RoastEvent(
            RoastEventId.SC_START,
            timer(),
            bt.currentDataSig[GET]()
        ),
    });
}

export function handleSCEnd() {
    setRoastEvents({
        ...roastEvents(),
        SC_END: new RoastEvent(
            RoastEventId.SC_END,
            timer(),
            bt.currentDataSig[GET]()
        ),
    });
}

export function handleDrop() {
    setRoastEvents({
        ...roastEvents(),
        DROP: new RoastEvent(
            RoastEventId.DROP,
            timer(),
            bt.currentDataSig[GET]()
        ),
    });
}

export async function buttonOnClicked() {
    // implicit reset data
    resetChannels();

    await invoke("button_on_clicked");
    setStatus(AppStatus.ON);
    setLogArr([...logArr(), "start reading channels..."]);
}

export async function buttonOffClicked() {
    await invoke("button_off_clicked");
    if (timer_worker) {
        timer_worker.terminate();
    }

    setStatus(AppStatus.OFF);

    setLogArr([...logArr(), "stopped reading channels"]);
}

export async function buttonStartClicked() {
    timer_worker = new WorkerFactory(timerWorker) as Worker;
    timer_worker.postMessage(1000);
    timer_worker.onmessage = (event: any) => {
        setTimer(event.data);
    };

    setStatus(AppStatus.RECORDING);
    setLogArr([...logArr(), "start recording"]);
}

export async function buttonResetClicked() {
    resetChannels();
    resetNotes();
    setStatus(AppStatus.OFF);
}

export default function DashboardPanel() {
    return (
        <>
            <Show
                when={
                    status() == AppStatus.RECORDING &&
                    roastEvents().FC_START != undefined
                }
            >
                <div class="bg-base-300 rounded w-full px-1 text-4xl text-blue-600 font-bold py-1 flex">
                    <span class="flex-grow text-center">
                        {developPhase().percent.toFixed(1) + "%"}
                    </span>
                    <span class="flex-grow text-center">
                        {Math.floor(developPhase().time / 60).toString() +
                            ":" +
                            (developPhase().time % 60)
                                .toString()
                                .padStart(2, "0")}
                    </span>

                    <span class="flex-grow text-center">
                        {developPhase().temp_rise.toFixed(1) + "°"}
                    </span>
                </div>
            </Show>
            {/* timer and on/off buttons */}
            <div class="flex flex-wrap gap-1">
                <div class="flex items-center justify-center bg-black text-white rounded text-4xl font-extrabold w-28 ">
                    <Show
                        when={
                            status() == AppStatus.ON ||
                            status() == AppStatus.RECORDING
                        }
                        fallback={"00:00"}
                    >
                        {timestamp_format(
                            timer() + appState().timeDeltaSig[GET]()
                        )}
                    </Show>
                </div>
                <Show when={status() == AppStatus.OFF}>
                    <button
                        class="ml-auto btn btn-accent rounded relative w-20"
                        onClick={buttonResetClicked}
                        tabindex="-1"
                    >
                        RESET
                        <span class="absolute bottom-0 right-0 mr-1 underline text-xs">
                            R
                        </span>
                    </button>

                    <button
                        class="btn btn-accent rounded relative w-20"
                        onClick={buttonOnClicked}
                        tabindex="-1"
                    >
                        ON
                        <span class="absolute bottom-0 right-0 mr-1 underline text-xs">
                            Q
                        </span>
                    </button>
                </Show>
                <Show when={status() == AppStatus.ON}>
                    <button
                        class="ml-auto btn btn-accent rounded relative w-20"
                        onClick={buttonOffClicked}
                        tabindex="-1"
                    >
                        OFF
                        <span class="absolute bottom-0 right-0 mr-1 underline text-xs">
                            E
                        </span>
                    </button>

                    <button
                        class="btn btn-accent rounded relative w-20"
                        onClick={buttonStartClicked}
                        tabindex="-1"
                    >
                        START
                        <span class="absolute bottom-0 right-0 mr-1 underline text-xs1">
                            W
                        </span>
                    </button>
                </Show>
                <Show when={status() == AppStatus.RECORDING}>
                    <button
                        class="ml-auto btn btn-accent rounded relative w-20"
                        onClick={buttonOffClicked}
                        tabindex="-1"
                    >
                        OFF
                        <span class="absolute bottom-0 right-0 mr-1 underline text-xs">
                            E
                        </span>
                    </button>
                </Show>
            </div>
            {/* channels */}
            <div class="flex flex-wrap gap-1">
                {/* BT */}
                <div class="bg-base-300 rounded text-right w-20 px-1 ">
                    <p>{bt.id}</p>
                    <p class="text-2xl leading-tight text-red-600">
                        {bt.currentDataSig[GET]().toFixed(1)}
                    </p>
                </div>

                <div class="bg-base-300 rounded text-right w-20 px-1">
                    <p>Δ BT</p>
                    <p class="text-2xl leading-tight text-blue-600">
                        {bt.currentRorSig[GET]().toFixed(1)}
                    </p>
                </div>

                <For each={channelArr().filter((c) => c.id != BT)}>
                    {(c) => (
                        <div class="bg-base-300 rounded text-right w-20 px-1">
                            <p>{c.id}</p>
                            <p class="text-2xl leading-tight text-red-600">
                                {c.currentDataSig[GET]().toFixed(1)}
                            </p>
                        </div>
                    )}
                </For>
            </div>
            <div>
                <PhaseChart
                    data={[
                        {
                            id: "G",
                            dry: ghost().dryingPhase,
                            mai: ghost().maillardPhase,
                            dev: ghost().developPhase,
                        },
                        {
                            id: "#",
                            dry: dryingPhase(),
                            mai: maillardPhase(),
                            dev: developPhase(),
                        },
                    ]}
                ></PhaseChart>
            </div>
            <div class="flex flex-wrap gap-1">
                <For each={appState().alarmsArrSig[GET]()}>
                    {(alarm) => (
                        <div
                            class={`badge badge-secondary ${
                                alarm.triggeredSig[GET]() ? "" : "badge-outline"
                            }`}
                        >
                            {alarm.temperature + "°"}
                        </div>
                    )}
                </For>
            </div>
            {/* event buttons */}
            <div class="flex flex-wrap gap-1">
                <button
                    class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().CHARGE != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
                    onClick={handleCharge}
                    tabindex="-1"
                >
                    CHARGE
                    <span class="absolute bottom-0 right-0 mr-1 underline text-xs">
                        Z
                    </span>
                </button>

                <button
                    class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().DRY_END != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
                    onClick={handleDryEnd}
                    tabindex="-1"
                >
                    DRY END
                    <span class="absolute bottom-0 right-0 mr-1 underline text-xs">
                        X
                    </span>
                </button>

                <button
                    class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().FC_START != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
                    onClick={handleFCStart}
                    tabindex="-1"
                >
                    FC START
                    <span class="absolute bottom-0 right-0 mr-1 underline text-xs">
                        C
                    </span>
                </button>

                <button
                    class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().FC_END != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
                    onClick={handleFCEnd}
                    tabindex="-1"
                >
                    FC END
                    <span class="absolute bottom-0 right-0 mr-1 underline text-xs">
                        V
                    </span>
                </button>

                <button
                    class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().SC_START != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
                    onClick={handleSCStart}
                    tabindex="-1"
                >
                    SC START
                    <span class="absolute bottom-0 right-0 mr-1 underline text-xs">
                        B
                    </span>
                </button>

                <button
                    class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().SC_END != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
                    onClick={handleSCEnd}
                    tabindex="-1"
                >
                    SC END
                    <span class="absolute bottom-0 right-0 mr-1 underline text-xs">
                        N
                    </span>
                </button>

                <button
                    class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().DROP != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
                    onClick={handleDrop}
                    tabindex="-1"
                >
                    DROP
                    <span class="absolute bottom-0 right-0 mr-1 underline text-xs">
                        M
                    </span>
                </button>
            </div>
            <For each={manualChannelArr()}>
                {(mc) => <RangeInput channel_id={mc.id}></RangeInput>}
            </For>
            <div class="flex flex-wrap gap-1">
                <select
                    class="select select-bordered select-sm"
                    id="event_select"
                    // onChange={(e) => {
                    //     console.log(e.currentTarget.value);
                    // }}
                >
                    <option value="" disabled selected>
                        Select Event
                    </option>
                    <For each={Object.keys(roastEvents())}>
                        {(key) => {
                            if (key != undefined) {
                                return (
                                    <option
                                        hidden={
                                            (roastEvents() as any)[key] ==
                                            undefined
                                        }
                                        value={key}
                                    >
                                        {key}
                                    </option>
                                );
                            }
                        }}
                    </For>
                </select>

                <button
                    class="btn btn-sm btn-square"
                    onClick={() => {
                        let select_value = (
                            document.getElementById(
                                "event_select"
                            ) as HTMLSelectElement
                        ).value;
                        let target = (roastEvents() as any)[select_value];

                        if (target != undefined) {
                            // use >= because target timestamp might be in between dataArr points
                            let index = bt
                                .dataArr()
                                .findIndex(
                                    (element) =>
                                        element.timestamp >= target!.timestamp
                                );
                            let newRoastEvents = { ...roastEvents() };
                            (newRoastEvents as any)[select_value] =
                                new RoastEvent(
                                    select_value as any,
                                    bt.dataArr()[index - 1].timestamp,
                                    bt.dataArr()[index - 1].value
                                );

                            setRoastEvents(newRoastEvents);

                            if (select_value == RoastEventId.CHARGE) {
                                appState().timeDeltaSig[SET](
                                    -bt.dataArr()[index - 1].timestamp
                                );
                            }

                            let result = calculatePhases(
                                timer(),
                                bt.currentDataSig[GET](),
                                roastEvents()
                            );
                            setDryingPhase(result.dry);
                            setMaillardPhase(result.mai);
                            setDevelopPhase(result.dev);
                        }
                    }}
                >
                    &lt;
                </button>

                <button
                    class="btn btn-sm btn-square"
                    onClick={() => {
                        let select_value = (
                            document.getElementById(
                                "event_select"
                            ) as HTMLSelectElement
                        ).value;
                        let target = (roastEvents() as any)[select_value];

                        if (target != undefined) {
                            let index = bt
                                .dataArr()
                                .findIndex(
                                    (element) =>
                                        element.timestamp >= target!.timestamp
                                );
                            let newRoastEvents = { ...roastEvents() };
                            (newRoastEvents as any)[select_value] =
                                new RoastEvent(
                                    select_value as any,
                                    bt.dataArr()[index + 1].timestamp,
                                    bt.dataArr()[index + 1].value
                                );

                            setRoastEvents(newRoastEvents);

                            if (select_value == RoastEventId.CHARGE) {
                                appState().timeDeltaSig[SET](
                                    -bt.dataArr()[index + 1].timestamp
                                );
                            }

                            let result = calculatePhases(
                                timer(),
                                bt.currentDataSig[GET](),
                                roastEvents()
                            );
                            setDryingPhase(result.dry);
                            setMaillardPhase(result.mai);
                            setDevelopPhase(result.dev);
                        }
                    }}
                >
                    &gt;
                </button>
            </div>
            <Show when={logArr().length > 0}>
                <div class="text-sm">
                    {/* show 5 lines of logArr, newest on top */}
                    <For each={logArr().slice(-5).reverse()}>
                        {(item) => (
                            <p class="px-1 border-b first:bg-base-200">
                                {item.toString()}
                            </p>
                        )}
                    </For>
                </div>
            </Show>
        </>
    );
}
