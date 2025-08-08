import { BaseSchemes, GetSchemes } from 'rete';
import { AreaExtensions, AreaPlugin } from 'rete-area-plugin';
import { FlowEditorService } from './flow-editor.service';

type ExpectedSchemes = GetSchemes<BaseSchemes['Node'], BaseSchemes['Connection'] & { selected?: boolean }>

export function createSelector<Schemes extends ExpectedSchemes, K>(area: AreaPlugin<Schemes, K>, flowEditorService: FlowEditorService) {
  const selector = AreaExtensions.selector()
  const accumulating = AreaExtensions.accumulateOnCtrl()

  AreaExtensions.selectableNodes(area, selector, { accumulating });

  function unselectConnection(c: Schemes['Connection']) {
    c.selected = false
    area.update('connection', c.id);
    flowEditorService.nodeClick.next(c);
  }

  function selectConnection(c: Schemes['Connection']) {
    selector.add({
      id: c.id,
      label: 'connection',
      translate() { },
      unselect() {
        unselectConnection(c)
      },
    }, accumulating.active())
    c.selected = true
    area.update('connection', c.id);
    // pass connection id and state to the node editor component
    flowEditorService.connectionInfo.next({ id: c.id, selected: c.selected });
    flowEditorService.nodeClick.next(c);
  }

  return {
    selectConnection,
    unselectConnection
  }
}
