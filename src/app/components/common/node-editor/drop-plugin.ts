import { BaseSchemes, ClassicPreset, GetSchemes, NodeEditor, Root, Scope } from 'rete'
import { AngularArea2D } from 'rete-angular-plugin';
import { Area2D, AreaPlugin } from 'rete-area-plugin'
import { Position } from 'rete-area-plugin/_types/types'
import { ContextMenuExtra } from 'rete-context-menu-plugin';
import { DockPlugin } from 'rete-dock-plugin'
import { Connection } from './editor';
import { Filter } from './filter';
import { MinimapExtra } from 'rete-minimap-plugin';
import { DropStrategy } from './drop-stratgey';

type Node = Filter
type Schemes = GetSchemes<Node, Connection<Node, Node>>;
type AreaExtra = AngularArea2D<Schemes> | MinimapExtra | ContextMenuExtra;

export class DropNodePlugin extends DockPlugin<BaseSchemes> {
  dropStrategy!: DropStrategy<never>
  constructor(private editor: NodeEditor<BaseSchemes>, private area: AreaPlugin<Schemes, AreaExtra>) {
    super();
  }

  setParent(scope: Scope<Area2D<Schemes>, [Root<Schemes>]>): void {
    super.setParent(scope)
    const area = this.parentScope<AreaPlugin<Schemes>>(AreaPlugin)
    const editor = area.parentScope<NodeEditor<Schemes>>(NodeEditor)
    this.dropStrategy = new DropStrategy(editor, area)
  }

  public add(create: () => Schemes['Node'], index?: number) {
    if (!this.presets.length) throw new Error('presets not found')
    for (const preset of this.presets) {
      const element = preset.createItem(index)
      if (!element) continue
      this.parentScope().emit({
        type: 'render',
        data: {
          type: 'node',
          element,
          payload: create()
        }
      })

      this.nodes.set(create, { preset, element })
      this.clickStrategy.add(element, create)
      this.dropStrategy.add(element, create)
      return
    }
  }

  public async drop(node: BaseSchemes['Node'], position: Position) {
    const index = this.editor.getNodes().findIndex((n: Node) => n.label == 'Filter');
    if (index != -1) {
      return;
    }
    await this.editor.addNode(node)
    const view = this.area.nodeViews.get(node.id)
    if (!view) throw new Error('view')
    await view.translate(position.x, position.y)
  }
}
