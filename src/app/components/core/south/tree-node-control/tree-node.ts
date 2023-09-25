
export interface TreeNode {
    id: string;
    children: TreeNode[];
    isExpanded?: boolean;
    parent: string;
    type?: string;
}

export interface DropNodeInfo {
    targetId: string;
    action?: string;
}