import { BaseSchemes } from "rete";
import { AreaPlugin } from "rete-area-plugin";

export function addCustomBackground<S extends BaseSchemes, K>(
  area: AreaPlugin<S, K>
) {
  const background = document.createElement("div");

  background.style.display = 'table';
  background.style.zIndex = '-1';
  background.style.position = 'absolute';
  background.style.top = '-320000px';
  background.style.left = '-320000px';
  background.style.width = '640000px';
  background.style.height = '640000px';

  background.style.backgroundColor = '#ffffff';
  background.style.opacity = '1';
  background.style.backgroundImage = 'linear-gradient(#f1f1f1 3.2px, transparent 3.2px),' +
  'linear-gradient(90deg, #f1f1f1 3.2px, transparent 3.2px),'+
  'linear-gradient(#f1f1f1 1.6px, transparent 1.6px),'+
  'linear-gradient(90deg, #f1f1f1 1.6px, #ffffff 1.6px)';
  background.style.backgroundSize = '80px 80px, 80px 80px, 16px 16px, 16px 16px';
  background.style.backgroundPosition = '-3.2px -3.2px, -3.2px -3.2px, -1.6px -1.6px, -1.6px -1.6px';

  area.area.content.add(background);

}
