import EVENTS from '../events.js';
import external from '../externalModules.js';
import copyPoints from '../util/copyPoints.js';
import triggerEvent from '../util/triggerEvent.js';
import { getLogger } from '../util/logger.js';

const logger = getLogger('eventListeners:airVertEventListeners');

let isClickEvent = true;
let preventClickTimeout;
const clickDelay = 200;

const addedListeners = new Map();

function getEventButtons(event) {
  // Right
  return 3;
}

function preventClickHandler() {
  isClickEvent = false;
}

function airTouchDown(e) {
  const element = e.currentTarget;
  const enabledElement = external.cornerstone.getEnabledElement(element);

  if (!enabledElement.image) {
    return;
  }

  preventClickTimeout = setTimeout(preventClickHandler, clickDelay);

  // Prevent MOUSE_MOVE while air is down
  element.removeEventListener('AirTouchMove', airTouchMove);

  const startPoints = {
    image: external.cornerstone.pageToPixel(
      element,
      e.detail.posViewport.x,
      e.detail.posViewport.y
    ),
    client: {
      x: e.detail.posViewport.x,
      y: e.detail.posViewport.y,
    },
    // Wrong, simply set to client:
    page: {
      x: e.detail.posViewport.x,
      y: e.detail.posViewport.y,
    },
  };

  startPoints.canvas = external.cornerstone.pixelToCanvas(
    element,
    startPoints.image
  );

  let lastPoints = copyPoints(startPoints);

  const eventData = {
    event: e,
    buttons: getEventButtons(e),
    viewport: external.cornerstone.getViewport(element),
    image: enabledElement.image,
    element,
    startPoints,
    lastPoints,
    currentPoints: startPoints,
    deltaPoints: {
      x: 0,
      y: 0,
    },
    type: EVENTS.MOUSE_DOWN,
  };

  const eventPropagated = triggerEvent(
    eventData.element,
    EVENTS.MOUSE_DOWN,
    eventData
  );

  if (eventPropagated) {
    // No tools responded to this event, create a new tool
    eventData.type = EVENTS.MOUSE_DOWN_ACTIVATE;
    triggerEvent(eventData.element, EVENTS.MOUSE_DOWN_ACTIVATE, eventData);
  }

  function onMouseMove(e) {
    // Calculate our current points in page and image coordinates
    const eventType = EVENTS.MOUSE_DRAG;
    const currentPoints = {
      image: external.cornerstone.pageToPixel(
        element,
        e.detail.posViewport.x,
        e.detail.posViewport.y
      ),
      client: {
        x: e.detail.posViewport.x,
        y: e.detail.posViewport.y,
      },
      // Wrong, simply set to client:
      page: {
        x: e.detail.posViewport.x,
        y: e.detail.posViewport.y,
      },
    };

    currentPoints.canvas = external.cornerstone.pixelToCanvas(
      element,
      currentPoints.image
    );

    // Calculate delta values in page and image coordinates
    const deltaPoints = {
      page: external.cornerstoneMath.point.subtract(
        currentPoints.page,
        lastPoints.page
      ),
      image: external.cornerstoneMath.point.subtract(
        currentPoints.image,
        lastPoints.image
      ),
      client: external.cornerstoneMath.point.subtract(
        currentPoints.client,
        lastPoints.client
      ),
      canvas: external.cornerstoneMath.point.subtract(
        currentPoints.canvas,
        lastPoints.canvas
      ),
    };

    logger.log('mousemove: %o', getEventButtons(e));
    const eventData = {
      buttons: getEventButtons(e),
      viewport: external.cornerstone.getViewport(element),
      image: enabledElement.image,
      element,
      startPoints,
      lastPoints,
      currentPoints,
      deltaPoints,
      type: eventType,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      shiftKey: e.shiftKey,
    };

    triggerEvent(eventData.element, eventType, eventData);

    // Update the last points
    lastPoints = copyPoints(currentPoints);
  }

  // Hook mouseup so we can unbind our event listeners
  // When they stop dragging
  function onMouseUp(e) {
    // Cancel the timeout preventing the click event from triggering
    clearTimeout(preventClickTimeout);

    let eventType = EVENTS.MOUSE_UP;

    if (isClickEvent) {
      eventType = EVENTS.MOUSE_CLICK;
    }

    // Calculate our current points in page and image coordinates
    const currentPoints = {
      image: external.cornerstone.pageToPixel(
        element,
        e.detail.posViewport.x,
        e.detail.posViewport.y
      ),
      client: {
        x: e.detail.posViewport.x,
        y: e.detail.posViewport.y,
      },
      // Wrong, simply set to client:
      page: {
        x: e.detail.posViewport.x,
        y: e.detail.posViewport.y,
      },
    };

    currentPoints.canvas = external.cornerstone.pixelToCanvas(
      element,
      currentPoints.image
    );

    // Calculate delta values in page and image coordinates
    const deltaPoints = {
      page: external.cornerstoneMath.point.subtract(
        currentPoints.page,
        lastPoints.page
      ),
      image: external.cornerstoneMath.point.subtract(
        currentPoints.image,
        lastPoints.image
      ),
      client: external.cornerstoneMath.point.subtract(
        currentPoints.client,
        lastPoints.client
      ),
      canvas: external.cornerstoneMath.point.subtract(
        currentPoints.canvas,
        lastPoints.canvas
      ),
    };

    logger.log('mouseup: %o', getEventButtons(e));
    const eventData = {
      event: e,
      buttons: getEventButtons(e),
      viewport: external.cornerstone.getViewport(element),
      image: enabledElement.image,
      element,
      startPoints,
      lastPoints,
      currentPoints,
      deltaPoints,
      type: eventType,
    };

    triggerEvent(eventData.element, eventType, eventData);

    document.removeEventListener('AirTouchMove', onMouseMove);
    document.removeEventListener('AirTouchDragFlatVertEnd', onMouseUp);
    addedListeners.delete(onMouseMove);
    addedListeners.delete(onMouseUp);

    element.addEventListener('AirTouchMove', airTouchMove);

    isClickEvent = true;
  }

  document.addEventListener('AirTouchMove', onMouseMove);
  document.addEventListener('AirTouchDragFlatVertEnd', onMouseUp);
  addedListeners.set(onMouseMove, 'AirTouchMove');
  addedListeners.set(onMouseUp, 'AirTouchDragFlatVertEnd');
}

function airTouchMove(e) {
  const element = e.currentTarget || e.srcEvent.currentTarget;
  const enabledElement = external.cornerstone.getEnabledElement(element);

  if (!enabledElement.image) {
    return;
  }

  const eventType = EVENTS.MOUSE_MOVE;

  const startPoints = {
    image: external.cornerstone.pageToPixel(
      element,
      e.detail.posViewport.x,
      e.detail.posViewport.y
    ),
    client: {
      x: e.detail.posViewport.x,
      y: e.detail.posViewport.y,
    },
    // Wrong, simply set to client:
    page: {
      x: e.detail.posViewport.x,
      y: e.detail.posViewport.y,
    },
  };
  startPoints.canvas = external.cornerstone.pixelToCanvas(
    element,
    startPoints.image
  );

  let lastPoints = copyPoints(startPoints);

  // Calculate our current points in page and image coordinates
  const currentPoints = {
    image: external.cornerstone.pageToPixel(
      element,
      e.detail.posViewport.x,
      e.detail.posViewport.y
    ),
    client: {
      x: e.detail.posViewport.x,
      y: e.detail.posViewport.y,
    },
    // Wrong, simply set to client:
    page: {
      x: e.detail.posViewport.x,
      y: e.detail.posViewport.y,
    },
  };

  currentPoints.canvas = external.cornerstone.pixelToCanvas(
    element,
    currentPoints.image
  );

  // Calculate delta values in page and image coordinates
  const deltaPoints = {
    page: external.cornerstoneMath.point.subtract(
      currentPoints.page,
      lastPoints.page
    ),
    image: external.cornerstoneMath.point.subtract(
      currentPoints.image,
      lastPoints.image
    ),
    client: external.cornerstoneMath.point.subtract(
      currentPoints.client,
      lastPoints.client
    ),
    canvas: external.cornerstoneMath.point.subtract(
      currentPoints.canvas,
      lastPoints.canvas
    ),
  };

  const eventData = {
    viewport: external.cornerstone.getViewport(element),
    image: enabledElement.image,
    element,
    startPoints,
    lastPoints,
    currentPoints,
    deltaPoints,
    type: eventType,
  };

  triggerEvent(element, eventType, eventData);

  // Update the last points
  lastPoints = copyPoints(currentPoints);
}

function disable(element) {
  element.removeEventListener('AirTouchMove', airTouchMove);
  element.removeEventListener('AirTouchDragFlatVertStart', airTouchDown);
  // Make sure we have removed any listeners that were added within the above listeners (#1337)
  addedListeners.forEach((event, listener) => {
    document.removeEventListener(event, listener);
  });
  addedListeners.clear();
}

function enable(element) {
  // Prevent handlers from being attached multiple times
  disable(element);

  element.addEventListener('AirTouchMove', airTouchMove);
  element.addEventListener('AirTouchDragFlatVertStart', airTouchDown);
}

export default {
  enable,
  disable,
};
