import React from 'react';
import IconAdd from 'terra-icon/lib/icon/IconAdd';

export default function BadA11y() {
  return (
    <div>
      <img src="/logo.png" />
      <div onClick={() => {}}>Open</div>
      <button><IconAdd /></button>
      <input type="text" />
    </div>
  );
}
