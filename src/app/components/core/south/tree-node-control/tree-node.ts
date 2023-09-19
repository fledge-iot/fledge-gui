
export interface TreeNode {
    id: string;
    children: TreeNode[];
    isExpanded?: boolean;
}

export interface DropNodeInfo {
    targetId: string;
    action?: string;
}