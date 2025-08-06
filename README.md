# tl-actions

A small JavaScript module for declarative DOM event handling using `data-*` attributes. It separates HTML structure from behavior and avoids inline JavaScript like `onclick="..."`.

## Usage

Define your actions in JavaScript and use `data-*` attributes in HTML to bind them to DOM events. The module listens for events on matching elements and calls the appropriate action function.

There are three main data attributes used to define actions in the HTML:

### `data-tl-trigger`

**Usage:** `data-tl-trigger="[event]"`  
**Description:** Specifies which event triggers the action. Defaults to `click`.

### `data-tl-action`

**Usage:** `data-tl-action="[function]:[mode]"`  
**Description:** Specifies the action to run when the event is triggered. Format: `[function]:[mode]`. The function must be registered via `define()`, and the mode selects which variant to execute.

### `data-tl-params-[parameter]` (Optional)

**Usage:** `data-tl-params-[parameter]="[value]"`  
**Description:** Each parameter is passed via a separate `data-tl-params-[name]` attribute.

## Setup

To use tl-actions, define the available actions, their modes, and the corresponding functions via `define()`.  
Each function receives an object with:

- `el`: The DOM element that triggered the action.
- `ev`: The event object.
- `params`: An object containing the passed parameters.
- `mode`: The mode name as specified in `data-tl-action`.

**Example:**

```js
import { createTL } from './tl-actions.js';

const tl = createTL();

tl.define({
    copy: {
        text: ({ params }) => window.navigator.clipboard.writeText(params.text),
        url: () => window.navigator.clipboard.writeText(window.location.href),
    },
    open: {
        blank: ({ params }) => window.open(params.url, '_blank'),
    },
    remove: {
        result: ({ el, ev }) => {
            el.remove();
            console.log('Element removed:', el);
        }
    }
});

tl.init();
```

## Example HTML

```html
<div data-tl-trigger="click" data-tl-action="copy:text" data-tl-params-text="Hello, World!">
    Click to copy text
</div>

<div data-tl-trigger="click" data-tl-action="open:blank" data-tl-params-url="https://example.com">
    Open Example.com in a new tab
</div>

<div data-tl-trigger="click" data-tl-action="remove:result">
    Click to remove this element
</div>
```
