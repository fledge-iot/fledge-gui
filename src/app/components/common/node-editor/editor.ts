import { Injector } from "@angular/core";
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import { AngularPlugin, Presets, AngularArea2D } from "rete-angular-plugin/13";
import { ConnectionPlugin, Presets as ConnectionPresets } from "rete-connection-plugin";
import { AutoArrangePlugin, Presets as ArrangePresets } from "rete-auto-arrange-plugin";
import { ContextMenuExtra, ContextMenuPlugin, Presets as ContextMenuPresets } from "rete-context-menu-plugin";
import { DockPlugin, DockPresets } from "rete-dock-plugin";
// import { ScopesPlugin, Presets as ScopesPresets } from "rete-scopes-plugin";
import { CustomNodeComponent } from "./custom-node/custom-node.component";
import { HistoryExtensions, HistoryPlugin, Presets as HistoryPresets } from "rete-history-plugin";
import { addCustomBackground } from "./custom-background";

type Node = South_service | Filter | Applications;
type Schemes = GetSchemes<Node, Connection<Node, Node>>;
type AreaExtra = AngularArea2D<Schemes> | ContextMenuExtra;

class South_service extends ClassicPreset.Node {
    height = 140;
    width = 200;
    parent?: string;

    constructor(socket: ClassicPreset.Socket) {
        super("South_service");

        this.addControl("a", new ClassicPreset.InputControl("text", { initial: "hello" }));
        this.addOutput("port", new ClassicPreset.Output(socket));
    }
}

class Storage extends ClassicPreset.Node {
    height = 140;
    width = 200;
    parent?: string;

    constructor(socket: ClassicPreset.Socket) {
        super("Storage");

        this.addInput("port", new ClassicPreset.Input(socket));
    }
}

class Filter extends ClassicPreset.Node {
    height = 140;
    width = 200;
    parent?: string;

    constructor(socket: ClassicPreset.Socket, nodeName) {
        super("Filter");

        this.addControl(nodeName, new ClassicPreset.InputControl("text", { initial: nodeName }));
        this.addInput("port", new ClassicPreset.Input(socket));
        this.addOutput("port", new ClassicPreset.Output(socket));
    }
}

class Applications extends ClassicPreset.Node {
    height = 300;
    width = 600;
    parent?: string;

    constructor(socket: ClassicPreset.Socket) {
        super("Applications");

        this.addInput("port", new ClassicPreset.Input(socket));
        this.addOutput("port", new ClassicPreset.Output(socket));
    }
}

class Connection<A extends Node, B extends Node> extends ClassicPreset.Connection<A, B> { }

export async function createEditor(container: HTMLElement, injector: Injector, source: string, filterPipeline) {
    const socket = new ClassicPreset.Socket("socket");
    const editor = new NodeEditor<Schemes>();
    const area = new AreaPlugin<Schemes, AreaExtra>(container);
    const connection = new ConnectionPlugin<Schemes, AreaExtra>();
    const render = new AngularPlugin<Schemes, AreaExtra>({ injector });
    const arrange = new AutoArrangePlugin<Schemes>();
    const history = new HistoryPlugin<Schemes>();

    const contextMenu = new ContextMenuPlugin<Schemes>({
        items: ContextMenuPresets.classic.setup([
            ["South_service", () => new South_service(socket)],
            // ["Extra", [["Filter", () => new Filter(socket)]]]
            ["Filter", () => new Filter(socket, 'Filter')],
            ["Applications", () => new Applications(socket)]
        ])
    });
    const dock = new DockPlugin<Schemes>();
    // const scopes = new ScopesPlugin<Schemes>();

    render.addPreset(Presets.classic.setup(
        {
            customize: {
                node() {
                    return CustomNodeComponent;
                }
            }
        }
    ));
    connection.addPreset(ConnectionPresets.classic.setup());
    arrange.addPreset(ArrangePresets.classic.setup());
    render.addPreset(Presets.contextMenu.setup());
    dock.addPreset(DockPresets.classic.setup({ area, size: 100, scale: 0.6 }));
    // scopes.addPreset(ScopesPresets.classic.setup());
    HistoryExtensions.keyboard(history);
    history.addPreset(HistoryPresets.classic.setup());

    editor.use(area);
    area.use(connection);
    area.use(render);
    area.use(arrange);
    // area.use(contextMenu);
    area.use(dock);
    // area.use(scopes);
    area.use(history);

    if(source !== ''){
        dock.add(() => new Filter(socket, 'Filter'));
    }


    const southPlugin = new South_service(socket);
    const filterBranch = new Applications(socket);
    const db = new Storage(socket);

    await editor.addNode(southPlugin);
    await editor.addNode(db);

    // await area.translate(southPlugin.id, { x: -350, y: 0 });
    // await area.translate(filterBranch.id, { x: 0, y: 0 });
    // await area.translate(db.id, { x: 950, y: 0 });

    let fpLen = filterPipeline.length;
    if (fpLen == 0) {
        await editor.addNode(filterBranch);
        await editor.addConnection(
            new ClassicPreset.Connection(southPlugin, "port", filterBranch, "port")
        );
        await editor.addConnection(
            new ClassicPreset.Connection(filterBranch, "port", db, "port")
        );
    }
    else {
        let firstFilter = new Filter(socket, filterPipeline[0]);
        await editor.addNode(firstFilter);
        await editor.addConnection(
            new ClassicPreset.Connection(southPlugin, "port", firstFilter, "port")
        );

        if (fpLen == 1) {
            await editor.addConnection(
                new ClassicPreset.Connection(firstFilter, "port", db, "port")
            );
        }
        else {
            let lastFilter = new Filter(socket, filterPipeline[fpLen -1]);
            await editor.addNode(lastFilter);
            await editor.addConnection(
                new ClassicPreset.Connection(lastFilter, "port", db, "port")
            );

            for (let i = 1; i < fpLen - 1; i++) {
                let midFilter = new Filter(socket, filterPipeline[i]);
                await editor.addNode(midFilter);
                await editor.addConnection(
                    new ClassicPreset.Connection(firstFilter, "port", midFilter, "port")
                );
                firstFilter = midFilter;
            }
            await editor.addConnection(
                new ClassicPreset.Connection(firstFilter, "port", lastFilter, "port")
            );
        }
    }


    await arrange.layout();

    addCustomBackground(area);
    AreaExtensions.zoomAt(area, editor.getNodes());
    // AreaExtensions.simpleNodesOrder(area);
    AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
        accumulating: AreaExtensions.accumulateOnCtrl()
    });

    // console.log(editor.getNodes())
    // console.log(editor.getConnections())
}