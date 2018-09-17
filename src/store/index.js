import brush from './brushStore.js';

export const state = {
  isToolLocked: false,
  tools: [],
  clickProximity: 6,
  mousePositionImage: {},
  enabledElements: []
};

export const getters = {
  mouseTools: () =>
    state.tools.filter((tool) =>
      tool.supportedInteractionTypes.includes('mouse')
    ),
  touchTools: () =>
    state.tools.filter((tool) =>
      tool.supportedInteractionTypes.includes('touch')
    ),
  mousePositionImage: () => state.mousePositionImage,
  enabledElementByUID: (enabledElementUID) =>
    state.enabledElements.filter((enabledElement) =>
      enabledElement.toolDataUID === enabledElementUID
    )
};

export const setters = {
  mousePositionImage: (mousePositionImage) => {
    state.mousePositionImage = mousePositionImage;
  }
};

export const mutations = {
  SET_IS_TOOL_LOCKED: (isLocked) => {
    state.isToolLocked = isLocked;
  },
  ADD_ENABLED_ELEMENT: (enabledElement) => {
    state.enabledElements.push(enabledElement);

    if (brush) {
      brush.mutations.SET_ELEMENT_VISIBLE(enabledElement);
    }
  }
};

export default {
  modules: {
    brush
  },
  state,
  getters,
  mutations
};
