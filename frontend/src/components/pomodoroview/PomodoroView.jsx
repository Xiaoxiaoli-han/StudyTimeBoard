import React, { useState, useContext, createContext } from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import store from "../../redux-store";
import SubmitRecordService from "../../services/SubmitRecordService";

// css modules

const timerWrapper = {
  display: "flex",
  justifyContent: "center",
};

const workTimerProps = {
  colors: [["#49DD78", 0.33], ["#6C6CE0", 0.66], ["#E71A1A"]],
  strokeWidth: 8,
  size: 240,
  trailColor: "#F2F3F4",
};

const breakTimerProps = {
  colors: [
    ["#49DD78", 0.33],
    ["#49DD78", 0.33],
    ["#49DD78", 0.33],
  ],
  strokeWidth: 6,
  size: 240,
  trailColor: "#F2F3F4",
};

// js helper functions

function getCurrentTime() {
  let today = new Date();
  let currentHours = today.getHours();
  currentHours = ("0" + currentHours).slice(-2);
  let currentMinutes = today.getMinutes();
  currentMinutes = ("0" + currentMinutes).slice(-2);
  return currentHours + ":" + currentMinutes;
}

function submitRecord(startTime, doAlert = false) {
  //todo: submit the record via some http service to the backend
  let username = store.getState().auth.username;

  let recordData = {
    username: username,
    startTime: startTime,
    endTime: getCurrentTime(),
  };
  SubmitRecordService.submit_interval(recordData.username, recordData.startTime, recordData.endTime);
  if (doAlert) {
    alert(`${recordData.username}: ${recordData.startTime} to ${recordData.endTime}`);
  }
}

// constext variables through all components

const remainingTimeContext = createContext();

function RemainingTimeContextProvider(props) {
  const [startTime, setStartTime] = useState("");
  const [isUserBreaking, setIsUserBreaking] = useState(false); // define which clock to run
  const [ClockKey, setClockKey] = useState(0);
  const [isClockPlaying, setIsClockPlaying] = useState(false);
  const [workDurationMinutes, setWorkDurationMinutes] = useState(25);
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(5);

  return (
    <remainingTimeContext.Provider
      value={{
        startTime,
        setStartTime,
        isUserBreaking,
        setIsUserBreaking,
        ClockKey,
        setClockKey,
        isClockPlaying,
        setIsClockPlaying,
        workDurationMinutes,
        setWorkDurationMinutes,
        breakDurationMinutes,
        setBreakDurationMinutes,
      }}
    >
      {props.children}
    </remainingTimeContext.Provider>
  );
}

function ClockController() {
  const { startTime, setStartTime, setClockKey, setIsClockPlaying, isUserBreaking, setIsUserBreaking } = useContext(
    remainingTimeContext
  );

  const handleGo = () => {
    setIsClockPlaying(true);
    setStartTime(getCurrentTime());
  };
  const handleHold = () => {
    if (!isUserBreaking) {
      submitRecord(startTime, true);
    }
    setClockKey((prevKey) => prevKey + 1);
    setIsClockPlaying(false);
    setIsUserBreaking(false);
  };
  return (
    <div className="row">
      <button onClick={handleGo}>GO</button>
      <button onClick={handleHold}>Hold</button>
    </div>
  );
}

function ClockSettings() {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const {
    setClockKey,
    setIsClockPlaying,
    setIsUserBreaking,
    setWorkDurationMinutes,
    setBreakDurationMinutes,
  } = useContext(remainingTimeContext);

  const handleChange = (variableSetter) => {
    return (event) => variableSetter(event.target.value);
  };

  return (
    <div>
      <div>set work duration</div>
      <input
        className="input"
        type="number"
        name="minutes"
        onChange={handleChange(setWorkMinutes)}
        value={workMinutes}
      />

      <div>set break duration</div>
      <input
        className="input"
        type="number"
        name="minutes"
        onChange={handleChange(setBreakMinutes)}
        value={breakMinutes}
      />
      <button
        onClick={() => {
          setWorkDurationMinutes(workMinutes);
          setBreakDurationMinutes(breakMinutes);
          setIsUserBreaking(false);
          setIsClockPlaying(false);
          setClockKey((prevKey) => prevKey + 1);
        }}
      >
        Set Timer
      </button>
    </div>
  );
}

function RenderTimeWork({ remainingTime }) {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div>
      <div className="text-center"> work </div>
      <div style={{ fontSize: 81 }}>{`${minutes}:${seconds}`}</div>
    </div>
  );
}

// in the future might be different with RenderTimeWork, now is the same
function RenderTimeBreak({ remainingTime }) {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div>
      <div className="text-center"> break </div>
      <div style={{ fontSize: 81 }}>{`${minutes}:${seconds}`}</div>
    </div>
  );
}

function PomodoroClock() {
  //todo: useEffect: on component dismount == click hold

  const {
    startTime,
    setStartTime,
    isUserBreaking,
    setIsUserBreaking,
    ClockKey,
    workDurationMinutes,
    breakDurationMinutes,
    isClockPlaying,
    setIsClockPlaying,
  } = useContext(remainingTimeContext);

  // todo: make a soundService
  const audio_endbreak = new Audio(
    "https://www.fesliyanstudios.com/musicfiles/2016-08-23_-_News_Opening_4_-_David_Fesliyan.mp3"
  );
  const audio_endwork = new Audio(
    "https://www.fesliyanstudios.com/musicfiles/2016-08-23_-_News_Opening_5_-_David_Fesliyan.mp3"
  );

  const workCompleteHandler = () => {
    audio_endwork.play();
    setIsUserBreaking(true);
    setIsClockPlaying(true);
    submitRecord(startTime);
  };

  const breakCompleteHandler = () => {
    audio_endbreak.play();
    setIsUserBreaking(false);
    setIsClockPlaying(true); // todo: seems to be redundant
    setStartTime(getCurrentTime());
  };

  return (
    <>
      <div className="mt-5 mb-5" style={timerWrapper}>
        {isUserBreaking ? (
          <CountdownCircleTimer
            {...breakTimerProps}
            key={100 + ClockKey}
            isPlaying={isClockPlaying}
            duration={breakDurationMinutes * 60}
            onComplete={breakCompleteHandler}
          >
            {RenderTimeBreak}
          </CountdownCircleTimer>
        ) : (
          <CountdownCircleTimer
            {...workTimerProps}
            key={ClockKey}
            isPlaying={isClockPlaying}
            duration={workDurationMinutes * 60}
            onComplete={workCompleteHandler}
          >
            {RenderTimeWork}
          </CountdownCircleTimer>
        )}
      </div>
      <ClockController />
      <ClockSettings />
    </>
  );
}

function PomodoroClockApp() {
  return (
    <RemainingTimeContextProvider>
      <PomodoroClock />
    </RemainingTimeContextProvider>
  );
}

function PomodoroView() {
  return (
    <div className="container">
      <PomodoroClockApp />
    </div>
  );
}

export default PomodoroView;
