import React from 'react'
import { ProgressBar, Step } from 'react-step-progress-bar'

const StepProgressBar = (_props) => {
  return (
    <ProgressBar {..._props} filledBackground="linear-gradient(to right, #E3D1FF, #B593FF)">
      {_props.stepPositions.map((_, _index) => (
        <Step transition="scale" key={`step_progress_bar_${_index}`}>
          {({ accomplished }) => (
            <div className={`h-4 w-4 ${accomplished ? 'bg-purple-700' : 'bg-gray-200'} rounded-full`}></div>
          )}
        </Step>
      ))}
    </ProgressBar>
  )
}

export default StepProgressBar
