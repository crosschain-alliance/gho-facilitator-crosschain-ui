import React from 'react'

const Box = ({ children, className, ..._props }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl ${className}`} {..._props}>
      {children}
    </div>
  )
}

export default Box
