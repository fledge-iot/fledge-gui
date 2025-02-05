import { FlowEditorService } from './flow-editor.service';
import { ClassicPreset, GetSchemes, getUID } from 'rete';
import { BidirectFlow, Context, SocketData } from 'rete-connection-plugin';
import { getUpdatedFilterPipeline } from './editor';
import { Filter, PseudoNodeControl } from './nodes/filter';
import { South } from './nodes/south';
import { North } from './nodes/north';
import { Storage } from './nodes/storage';

type ClassicScheme = GetSchemes<ClassicPreset.Node, ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node> & { isLoop?: boolean }>

export class Connector<S extends ClassicScheme, K extends any[]> extends BidirectFlow<S, K> {
  constructor(props: { click: (data: S['Connection']) => void, remove: (data: S['Connection']) => void }, flowEditorService: FlowEditorService) {
    super({
      makeConnection<K extends any[]>(initial: SocketData, socket: SocketData, context: Context<S, K>) {
        // Avoid self loop of node connection
        if (initial.nodeId === socket.nodeId) {
          return;
        }

        const connectionExist = context.editor.getConnections().find(conn => (conn.source == initial.nodeId && conn.target == socket.nodeId));
        if (connectionExist) {
          return;
        }

        const fromNode = context.editor.getNode(initial.nodeId);
        const toNode = context.editor.getNode(socket.nodeId);

        const nodes = context.editor.getNodes();
        const isSouthSide = nodes.find(node => node.label == 'South');
        const isNorthSide = nodes.find(node => node.label == 'North');

        const invalidConnections = [
          { from: Storage, to: South, condition: true },
          { from: North, to: Storage, condition: true },
          { from: Filter, to: South, condition: true },
          { from: North, to: Filter, condition: true },
          { from: Storage, to: Filter, condition: isSouthSide },
          { from: Filter, to: Storage, condition: isNorthSide }
        ];

        // Check if connection is invalid
        const isInvalidConnection = (fromNode, toNode) => {
          return invalidConnections.some(({ from, to, condition }) => {
            return fromNode instanceof from &&
              toNode instanceof to &&
              condition;
          });
        };

        if (isInvalidConnection(fromNode, toNode)) {
          console.log('Invalid connection');
          return;
        }

        // Avoid connection loop in pipeline
        const updatedPipeline = getUpdatedFilterPipeline();
        console.log(updatedPipeline);

        let exists = false;
        if (typeof updatedPipeline == 'object') {
          exists = contains(toNode.label, updatedPipeline);
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

        // console.log('connect');
        // const pipeline = getUpdatedFilterPipeline();
        // console.log(pipeline);
        if (updatedPipeline.length > 0) {
          flowEditorService.emitPipelineUpdate(updatedPipeline);
        }



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
