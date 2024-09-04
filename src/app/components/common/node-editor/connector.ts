import { ClassicPreset, GetSchemes, getUID } from 'rete';
import { BidirectFlow, Context, SocketData } from 'rete-connection-plugin';
import { getUpdatedFilterPipeline } from './editor';
import { PseudoNodeControl } from './filter';

type ClassicScheme = GetSchemes<ClassicPreset.Node, ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node> & { isLoop?: boolean }>

export class Connector<S extends ClassicScheme, K extends any[]> extends BidirectFlow<S, K> {
  constructor(props: { click: (data: S['Connection']) => void, remove: (data: S['Connection']) => void }) {
    super({
      makeConnection<K extends any[]>(initial: SocketData, socket: SocketData, context: Context<S, K>) {
        // Avoid self loop of node connection
        if (initial.nodeId === socket.nodeId) {
          return;
        }

        const fromNode = context.editor.getNode(initial.nodeId);
        const toNode = context.editor.getNode(socket.nodeId);

        // Avoid connection loop in pipeline
        const pipeline = getUpdatedFilterPipeline();
        let exists = false;
        if (typeof pipeline == 'object') {
          exists = contains(toNode.label, pipeline);
          if (exists) {
            return;
          }
        }

        context.editor.addConnection(
          {
            id: getUID(),
            source: initial.nodeId,
            sourceOutput: initial.key,
            target: socket.nodeId,
            targetInput: socket.key,
            isLoop: false,
            ...props
          })

        // To hide/show (+) icon on the add filter node
        setTimeout(() => {
          const connections = context.editor.getConnections();
          if (fromNode.label == 'Filter') {
            const inputConnection = connections.find(conn => (fromNode.id == conn.source));
            const outputConnection = connections.find(conn => ((fromNode.id == conn.target)));
            if (inputConnection && outputConnection) {
              const pseudoNodeControl = fromNode.controls.pseudoNodeControl as PseudoNodeControl;
              pseudoNodeControl.pseudoConnection = true;
            }
          }

          if (toNode.label == 'Filter') {
            const inputConnection = connections.find(conn => (toNode.id == conn.source));
            const outputConnection = connections.find(conn => ((toNode.id == conn.target)));
            if (inputConnection && outputConnection) {
              const pseudoNodeControl = toNode.controls.pseudoNodeControl as PseudoNodeControl;
              pseudoNodeControl.pseudoConnection = true;
            }
          }
        }, 0);

        return true;
      }
    })
  }
}


export function contains(item: any, pipeline: any[]): boolean {
  // check element in filter pipeline
  for (const element of pipeline) {
    if (Array.isArray(element)) {
      // If the element is an array, check recursively
      if (contains(item, element)) {
        return true;
      }
    } else if (element === item) {
      // If the element matches the item, return true
      return true;
    }
  }
  // If the item is not found, return false
  return false;
}
