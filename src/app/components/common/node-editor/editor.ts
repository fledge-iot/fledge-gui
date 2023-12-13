import { Injector } from "@angular/core";
import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import { AngularPlugin, Presets, AngularArea2D } from "rete-angular-plugin/13";
import { ConnectionPlugin, Presets as ConnectionPresets } from "rete-connection-plugin";
import { AutoArrangePlugin, Presets as ArrangePresets, ArrangeAppliers } from "rete-auto-arrange-plugin";
import { ContextMenuExtra, ContextMenuPlugin, Presets as ContextMenuPresets } from "rete-context-menu-plugin";
import { DockPlugin, DockPresets } from "rete-dock-plugin";
// import { ScopesPlugin, Presets as ScopesPresets } from "rete-scopes-plugin";
import { CustomNodeComponent } from "./custom-node/custom-node.component";
import { HistoryExtensions, HistoryPlugin, Presets as HistoryPresets } from "rete-history-plugin";
import { addCustomBackground } from "./custom-background";
import { easeInOut } from "popmotion";
import { insertableNodes } from "./insert-node";
import { CustomConnectionComponent } from "./custom-connection/custom-connection.component";
import { CustomSocketComponent } from "./custom-socket/custom-socket.component";
import { South } from "./south";
import { Storage } from "./storage";
import { Filter } from "./filter";
import { Applications } from "./applications";
import { AddService } from "./add-service";

type Node = South | Filter | Applications;
type Schemes = GetSchemes<Node, Connection<Node, Node>>;
type AreaExtra = AngularArea2D<Schemes> | ContextMenuExtra;

class Connection<A extends Node, B extends Node> extends ClassicPreset.Connection<A, B> { }

export async function createEditor(container: HTMLElement, injector: Injector, source: string, filterPipeline, service, services) {
    const socket = new ClassicPreset.Socket("socket");
    const editor = new NodeEditor<Schemes>();
    const area = new AreaPlugin<Schemes, AreaExtra>(container);
    const connection = new ConnectionPlugin<Schemes, AreaExtra>();
    const render = new AngularPlugin<Schemes, AreaExtra>({ injector });
    const arrange = new AutoArrangePlugin<Schemes>();
    const history = new HistoryPlugin<Schemes>();
    const animatedApplier = new ArrangeAppliers.TransitionApplier<Schemes, never>(
        {
            duration: 500,
            timingFunction: easeInOut
        }
    );

    insertableNodes(area, {
        async createConnections(node, connection) {
            await editor.addConnection(
                new Connection(
                    editor.getNode(connection.source),
                    connection.sourceOutput,
                    node,
                    "port"
                )
            );
            await editor.addConnection(
                new Connection(
                    node,
                    "port",
                    editor.getNode(connection.target),
                    connection.targetInput
                )
            );
            arrange.layout({
                applier: animatedApplier
            });
        }
    });

    // const contextMenu = new ContextMenuPlugin<Schemes>({
    //     items: ContextMenuPresets.classic.setup([
    //         ["Filter", () => new Filter(socket, 'Filter')]
    //     ])
    // });

    const contextMenu = new ContextMenuPlugin<Schemes>({
        items(context) {
            if (context === 'root') {
                return {
                    searchBar: false,
                    list: [
                        {
                            label: 'Filter', key: '1', handler: () => {
                                let filter = new Filter(socket, 'Filter');
                                editor.addNode(filter);
                            }
                        }
                    ]
                }
            }
        }
    })

    const dock = new DockPlugin<Schemes>();
    // const scopes = new ScopesPlugin<Schemes>();

    render.addPreset(Presets.classic.setup(
        {
            customize: {
                node() {
                    return CustomNodeComponent;
                },
                connection() {
                    return CustomConnectionComponent
                },
                socket() {
                    return CustomSocketComponent
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
    area.use(dock);
    // area.use(scopes);
    area.use(history);

    if (source !== '' && source !== "nodelist") {
        area.use(contextMenu);
        dock.add(() => new Filter(socket, 'Filter'));
    }

    createNodesAndConnections(socket, service, editor, filterPipeline, arrange, area, source, services);
}

async function createNodesAndConnections(socket, service, editor, filterPipeline, arrange, area, source, services) {

    if(source !== "nodelist"){
        const southPlugin = new South(socket, service);
        const filterBranch = new Applications(socket);
        const db = new Storage(socket);
    
        await editor.addNode(southPlugin);
        await editor.addNode(db);
    
        // await area.translate(southPlugin.id, { x: -350, y: 0 });
        // await area.translate(filterBranch.id, { x: 0, y: 0 });
        // await area.translate(db.id, { x: 950, y: 0 });
    
        let fpLen = filterPipeline.length;
        if (fpLen == 0) {
            // await editor.addNode(filterBranch);
            await editor.addConnection(
                new ClassicPreset.Connection(southPlugin, "port", db, "port")
            );
            // await editor.addConnection(
            //     new ClassicPreset.Connection(filterBranch, "port", db, "port")
            // );
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
                let lastFilter = new Filter(socket, filterPipeline[fpLen - 1]);
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
        AreaExtensions.zoomAt(area, editor.getNodes());
    }
    else{
        let j=0;
        let k=0;
        for (let i=0; i<services.length; i++){
            const southPlugin = new South(socket, services[i]);
            await editor.addNode(southPlugin);
            if(j<4){
                await area.translate(southPlugin.id, { x: 250*j, y: 250*k });
                j++;
                if(j==4){
                    j=0; k++;
                }
            }
        }
        const addService = new AddService();
        await editor.addNode(addService);
        await area.translate(addService.id, { x: 250*j, y: 250*k });
    }


    addCustomBackground(area);
    // AreaExtensions.simpleNodesOrder(area);
    AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
        accumulating: AreaExtensions.accumulateOnCtrl()
    });
}