/* eslint-disable */
// ---------------------------------------------- SCANNER -----------------------------------

let __ReactSightDebugMode = false;
let __ReactSightStore = true;

/**
 * Strips name of function from component props
 *
 * @param {func} fn - function
 * @returns {string} function's name
 */
const parseFunction = (fn) => {
  const string = `${fn}`;

  const match = string.match(/function/);
  if (match == null) return 'fn()';

  const firstIndex = match[0]
    ? string.indexOf(match[0]) + match[0].length + 1
    : null;
  if (firstIndex == null) return 'fn()';

  const lastIndex = string.indexOf('(');
  const fnName = string.slice(firstIndex, lastIndex);
  if (!fnName.length) return 'fn()';
  return `${fnName} ()`;
};

const props16 = (node) => {
  try {
    const props = {};
    const keys = Object.keys(node.memoizedProps);

    keys.forEach((prop) => {
      const value = node.memoizedProps[prop];
      if (typeof value === 'function') props[prop] = parseFunction(value);
      // TODO - get these objects to work, almost always children property
      else if (typeof node.memoizedProps[prop] === 'object') {
        // console.log("PROP Object: ", node.memoizedProps[prop]);
        props[prop] = 'object*';

        // TODO - parse object
      } else props[prop] = node.memoizedProps[prop];
    });
    return { props, stateNode: node.stateNode };
  } catch (e) {
    return {};
  }
};

/** TODO: Get Props
 *
 * Traverse through vDOM (React 16) and build up JSON data
 *
 */

function getDom(fiberNode) {
  return fiberNode?.child?.stateNode;
}

async function getScreenshot(fiberNode) {
  // return null;
  try {
    // const res = await domtoimage.toPng(fiberNode?.child?.stateNode)
    // return res;
    const res = await html2canvas(fiberNode?.child?.stateNode);
    return res.toDataURL();
  } catch {
    return undefined;
  }
}

let promises = [];
export let res = [];

const recur16 = async (node, parentArr) => {
  const newComponent = {
    name: '',
    children: [],
    state: null,
    props: null,
    id: null,
    isDOM: null,
  };

  // TODO ** only works on local host **
  // get ID
  if (node._debugID) newComponent.id = node._debugID;

  // get name and type
  if (node.type) {
    if (node.type.name) {
      newComponent.name = node.type.name;
      newComponent.isDOM = false;
    } else {
      newComponent.name = node.type;
      newComponent.isDOM = true;
    }
  }

  // get state
  if (node.memoizedState) newComponent.state = node.memoizedState;

  // get props
  if (node.memoizedProps) newComponent.props = props16(node).props;
  if (node.memoizedProps) newComponent.stateNode = props16(node).stateNode;

  // get store
  if (node.type && node.type.propTypes) {
    if (node.type.propTypes.hasOwnProperty('store')) {
      // TODO replace with safety check
      try {
        __ReactSightStore = node.stateNode.store.getState();
      } catch (e) {
        // noop
        // console.log('Error getting store: ', e);
      }
    }
  }

  if (node?.type?.name && getDom(node)) {
    // promises.push(getScreenshot(node));
    res.push({
      type: node?.type?.name,
      dom: getDom(node),
      screenshot: await getScreenshot(node),
      newComponent,
      b: node?._debugSource,
      node,
    });
    console.log('🚀 ~ file: index.tsx:144 ~ traverse16 ~ clone', res);
  }

  newComponent.children = [];
  parentArr.push(newComponent);
  if (node.child != null) recur16(node.child, newComponent.children);
  if (node.sibling != null) recur16(node.sibling, parentArr);
};

const traverse16 = async (fiberDOM) => {
  if (typeof fiberDOM === 'undefined') return;
  if (__ReactSightDebugMode)
    console.log('[ReactSight] traverse16 vDOM: ', fiberDOM);
  const components = [];
  try {
    await recur16(fiberDOM.current.stateNode.current, components);
  } catch (e) {
    console.log('error');
  }
  console.log(res);
  // console.log(await Promise.allSettled(promises))
  // console.timeEnd()
  if (__ReactSightDebugMode)
    console.log('[ReactSight] traverse16 data: ', components);

  const ReactSightData = { data: components, store: __ReactSightStore };

  console.log('🚀 ~ file: index.tsx:144 ~ traverse16 ~ clone', ReactSightData);

  // if (__ReactSightDebugMode) console.log('[ReactSight] retrieved data --> posting to content-scripts...: ', ReactSightData);
  // if (__ReactSightDebugMode) console.log('[ReactSight] SENDING -> ', clone);
};

let __ReactSightFiberDOM = null;
const devTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
if (devTools?.onCommitFiberRoot) {
  devTools.onCommitFiberRoot = (function (original) {
    return function (...args) {
      __ReactSightFiberDOM = args[1];
      return original(...args);
    };
  })(devTools.onCommitFiberRoot);
}

export async function installHook() {
  console.log('installHook');
  const reactInstances =
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers || new Map();
  const instance = reactInstances.get(1);
  // const reactRoot = window.document.body.childNodes;
  // no instance of React detected
  if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log(
      "Error: React DevTools not present. React Sight uses React DevTools to patch React's reconciler",
    );
    return;
  }
  // React fiber (16+)
  if (instance && instance.version) {
    __ReactSight_ReactVersion = instance.version;
    if (__ReactSightDebugMode)
      console.log('version: ', __ReactSight_ReactVersion);

    await traverse16(__ReactSightFiberDOM);
  }
  // React 15 or lower
  // else if (instance && instance.Reconciler) {
  //   // hijack receiveComponent method which runs after a component is rendered
  //   instance.Reconciler.receiveComponent = (function (original) {
  //     return function (...args) {
  //       if (!__ReactSightThrottle) {
  //         __ReactSightThrottle = true;
  //         setTimeout(() => {
  //           getData(instance);
  //           __ReactSightThrottle = false;
  //         }, 10);
  //       }
  //       return original(...args);
  //     };
  //   })(instance.Reconciler.receiveComponent);
  // }
  else console.log('[React Sight] React not found');
}
