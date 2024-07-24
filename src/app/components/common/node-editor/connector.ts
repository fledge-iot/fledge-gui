import { ClassicPreset, GetSchemes, getUID } from 'rete';
import { BidirectFlow, Context, SocketData } from 'rete-connection-plugin';

type ClassicScheme = GetSchemes<ClassicPreset.Node, ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node> & { isLoop?: boolean }>

export class Connector<S extends ClassicScheme, K extends any[]> extends BidirectFlow<S, K> {
  constructor(props: { click: (data: S['Connection']) => void, remove: (data: S['Connection']) => void }) {
    super({
      makeConnection<K extends any[]>(initial: SocketData, socket: SocketData, context: Context<S, K>) {
        context.editor.addConnection({
          id: getUID(),
          source: initial.nodeId,
          sourceOutput: initial.key,
          target: socket.nodeId,
          targetInput: socket.key,
          isLoop: initial.nodeId === socket.nodeId,
          ...props
        })
        return true
      }
    })
  }
}
