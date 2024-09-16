import BaseTool from './base/BaseTool.js';
import scroll from '../util/scroll.js';
import { getToolState } from '../stateManagement/toolState.js';
import { setToolOptions, getToolOptions } from '../toolOptions.js';
import { stackScrollCursor } from './cursors/index.js';

/**
 * @public
 * @class StackScrollTool
 * @memberof Tools
 *
 * @classdesc Tool for scrolling through a series.
 * @extends Tools.Base.BaseTool
 */
export default class StackScrollTool extends BaseTool {
  constructor(props = {}) {
    const defaultProps = {
      name: 'StackScroll',
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {
        loop: false,
        allowSkipping: true,
        horizScroll: false,
      },
      svgCursor: stackScrollCursor,
    };

    super(props, defaultProps);

    this.mouseDragCallback = this._dragCallback.bind(this);
    this.touchDragCallback = this._dragCallback.bind(this);
  }

  _dragCallback(evt) {
    const eventData = evt.detail;
    const { element, deltaPoints } = eventData;
    const { loop, allowSkipping, horizScroll } = this.configuration;
    const options = getToolOptions(this.name, element);

    const pixelsPerImage = this._getPixelPerImage(element);
    const deltaX = this._getDeltaX(element, deltaPoints.page.x);
    const deltaY = this._getDeltaY(element, deltaPoints.page.y);

    if (!pixelsPerImage) {
      return;
    }

    if (horizScroll) {
      if (Math.abs(deltaX) >= pixelsPerImage) {
        const imageIdIndexOffset = Math.round(deltaX / pixelsPerImage);

        scroll(element, imageIdIndexOffset, loop, allowSkipping);

        options.deltaX = deltaX % pixelsPerImage;
      } else {
        options.deltaX = deltaX;
      }
    } else {
      if (Math.abs(deltaY) >= pixelsPerImage) {
        const imageIdIndexOffset = Math.round(deltaY / pixelsPerImage);

        scroll(element, imageIdIndexOffset, loop, allowSkipping);

        options.deltaY = deltaY % pixelsPerImage;
      } else {
        options.deltaY = deltaY;
      }
    }

    setToolOptions(this.name, element, options);
  }

  _getDeltaX(element, deltaPointsX) {
    const options = getToolOptions(this.name, element);
    const deltaX = options.deltaX || 0;

    return deltaX + deltaPointsX;
  }

  _getDeltaY(element, deltaPointsY) {
    const options = getToolOptions(this.name, element);
    const deltaY = options.deltaY || 0;

    return deltaY + deltaPointsY;
  }

  _getPixelPerImage(element) {
    const toolData = getToolState(element, 'stack');

    if (!toolData || !toolData.data || !toolData.data.length) {
      return;
    }

    const stackData = toolData.data[0];
    const { stackScrollSpeed } = this.configuration;

    // The Math.max here makes it easier to mouseDrag-scroll small or really large image stacks
    return (
      stackScrollSpeed ||
      Math.max(2, element.offsetHeight / Math.max(stackData.imageIds.length, 8))
    );
  }
}
