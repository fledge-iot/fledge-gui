import { Injector } from "@angular/core";
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import { AngularPlugin, Presets, AngularArea2D } from "rete-angular-plugin/13";
import { ConnectionPlugin, Presets as ConnectionPresets } from "rete-connection-plugin";
// import { AutoArrangePlugin, Presets as ArrangePresets } from "rete-auto-arrange-plugin";
import { ContextMenuExtra, ContextMenuPlugin, Presets as ContextMenuPresets } from "rete-context-menu-plugin";
import { DockPlugin, DockPresets } from "rete-dock-plugin";
import { ScopesPlugin, Presets as ScopesPresets } from "rete-scopes-plugin";
// import { CustomNodeComponent } from "./custom-node/custom-node.component";
import { HistoryExtensions, HistoryPlugin, Presets as HistoryPresets } from "rete-history-plugin";


type Node = NodeA | NodeB | NodeParent;
type Schemes = GetSchemes<Node, Connection<Node, Node>>;
type AreaExtra = AngularArea2D<Schemes> | ContextMenuExtra;

class NodeA extends ClassicPreset.Node {
    height = 140;
    width = 200;
    parent?: string;

    constructor(socket: ClassicPreset.Socket) {
        super("NodeA");

        this.addControl("a", new ClassicPreset.InputControl("text", { initial: "hello" }));
        this.addOutput("port", new ClassicPreset.Output(socket));
    }
}

class NodeB extends ClassicPreset.Node {
    height = 140;
    width = 200;
    parent?: string;

    constructor(socket: ClassicPreset.Socket) {
        super("NodeB");

        this.addControl("b", new ClassicPreset.InputControl("text", { initial: "world" }));
        this.addInput("port", new ClassicPreset.Input(socket));
    }
}

class NodeParent extends ClassicPreset.Node {
    height = 140;
    width = 200;
    parent?: string;

    constructor(socket: ClassicPreset.Socket) {
        super("Parent");

        this.addInput("port", new ClassicPreset.Input(socket));
        this.addOutput("port", new ClassicPreset.Output(socket));
    }
}

class Connection<A extends Node, B extends Node> extends ClassicPreset.Connection<A, B> { }

export async function createEditor(container: HTMLElement, injector: Injector) {
    const socket = new ClassicPreset.Socket("socket");
    const editor = new NodeEditor<Schemes>();
    const area = new AreaPlugin<Schemes, AreaExtra>(container);
    const connection = new ConnectionPlugin<Schemes, AreaExtra>();
    const render = new AngularPlugin<Schemes, AreaExtra>({ injector });
    // const arrange = new AutoArrangePlugin<Schemes>();
    const history = new HistoryPlugin<Schemes>();

    const contextMenu = new ContextMenuPlugin<Schemes>({
        items: ContextMenuPresets.classic.setup([
            ["NodeA", () => new NodeA(socket)],
            // ["Extra", [["NodeB", () => new NodeB(socket)]]]
            ["NodeB", () => new NodeB(socket)],
            ["NodeParent", () => new NodeParent(socket)]
        ])
    });
    const dock = new DockPlugin<Schemes>();
    const scopes = new ScopesPlugin<Schemes>();

    render.addPreset(Presets.classic.setup());
    connection.addPreset(ConnectionPresets.classic.setup());
    // arrange.addPreset(ArrangePresets.classic.setup());
    render.addPreset(Presets.contextMenu.setup());
    dock.addPreset(DockPresets.classic.setup({ area, size: 100, scale: 0.6 }));
    scopes.addPreset(ScopesPresets.classic.setup());
    HistoryExtensions.keyboard(history);
    history.addPreset(HistoryPresets.classic.setup());

    editor.use(area);
    area.use(connection);
    area.use(render);
    // area.use(arrange);
    area.use(contextMenu);
    area.use(dock);
    area.use(scopes);
    area.use(history);

    dock.add(() => new NodeA(socket));
    dock.add(() => new NodeB(socket));
    dock.add(() => new NodeParent(socket));

    const parent1 = new NodeParent(socket);
    const b2 = new NodeB(socket);
    const parent3 = new NodeParent(socket);
    const a = new NodeA(socket);
    const b = new NodeB(socket);

    a.parent = parent1.id;
    b.parent = parent1.id;
    parent1.parent = parent3.id;
    b2.parent = parent3.id;

    await editor.addNode(parent3);
    await editor.addNode(parent1);
    await editor.addNode(b2);
    await editor.addNode(a);
    await editor.addNode(b);

    await editor.addConnection(
        new ClassicPreset.Connection(a, "port", b, "port")
    );
    await editor.addConnection(
        new ClassicPreset.Connection(parent1, "port", b2, "port")
    );


    // await arrange.layout();

    AreaExtensions.zoomAt(area, editor.getNodes());
    // AreaExtensions.simpleNodesOrder(area);
    AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
        accumulating: AreaExtensions.accumulateOnCtrl()
    });

    console.log(editor.getNodes())
    console.log(editor.getConnections())
}