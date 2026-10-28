/**
 * Node tools: status, info, services, and management for PVE cluster nodes.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PveClient } from "../core/client.js";
import { getRrdData, rrdDescription, rrdInputSchema } from "../core/rrd.js";
import { registerTool } from "../core/tools.js";
import type { AppConfig } from "../types/index.js";

export function registerNodeTools(
  server: McpServer,
  client: PveClient,
  config: AppConfig,
): void {
  // --- Read-only tools ---

  registerTool(server, config, {
    name: "pve_list_nodes",
    title: "List Nodes",
    description: "List all nodes in the Proxmox VE cluster",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    handler: async () => {
      const data = await client.get("/nodes");
      return JSON.stringify(data, null, 2);
    },
  });

  registerTool(server, config, {
    name: "pve_get_node_status",
    title: "Get Node Status",
    description:
      "Get detailed status of a specific node including CPU, memory, uptime, and load",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
    },
    handler: async (args) => {
      const data = await client.get(`/nodes/${args.node}/status`);
      return JSON.stringify(data, null, 2);
    },
  });

  registerTool(server, config, {
    name: "pve_get_node_rrddata",
    title: "Get Node RRD Data",
    description: rrdDescription(
      "a node itself (host-level, not per guest)",
      "CPU, IO wait, load average, memory, swap, root filesystem, network, pressure",
    ),
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
      ...rrdInputSchema,
    },
    handler: async (args) => getRrdData(client, `/nodes/${args.node}`, args),
  });

  registerTool(server, config, {
    name: "pve_get_node_version",
    title: "Get Node Version",
    description: "Get the PVE version information for a specific node",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
    },
    handler: async (args) => {
      const data = await client.get(`/nodes/${args.node}/version`);
      return JSON.stringify(data, null, 2);
    },
  });

  registerTool(server, config, {
    name: "pve_get_node_dns",
    title: "Get Node DNS",
    description: "Get DNS settings for a specific node",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
    },
    handler: async (args) => {
      const data = await client.get(`/nodes/${args.node}/dns`);
      return JSON.stringify(data, null, 2);
    },
  });

  registerTool(server, config, {
    name: "pve_get_node_time",
    title: "Get Node Time",
    description: "Get time and timezone information for a specific node",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
    },
    handler: async (args) => {
      const data = await client.get(`/nodes/${args.node}/time`);
      return JSON.stringify(data, null, 2);
    },
  });

  registerTool(server, config, {
    name: "pve_get_node_syslog",
    title: "Get Node Syslog",
    description: "Get system log entries from a specific node",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
      start: z.number().optional().describe("Start line number (default: 0)"),
      limit: z
        .number()
        .optional()
        .describe("Max number of log entries to return (default: 50)"),
    },
    handler: async (args) => {
      let path = `/nodes/${args.node}/syslog`;
      const params = new URLSearchParams();
      if (args.start !== undefined) params.set("start", String(args.start));
      if (args.limit !== undefined) params.set("limit", String(args.limit));
      const qs = params.toString();
      if (qs) path += `?${qs}`;
      const data = await client.get(path);
      return JSON.stringify(data, null, 2);
    },
  });

  registerTool(server, config, {
    name: "pve_list_node_services",
    title: "List Node Services",
    description: "List all system services and their status on a specific node",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
    },
    handler: async (args) => {
      const data = await client.get(`/nodes/${args.node}/services`);
      return JSON.stringify(data, null, 2);
    },
  });

  registerTool(server, config, {
    name: "pve_get_node_journal",
    title: "Get Node Journal",
    description:
      "Read the systemd journal of a specific node, optionally filtered by time range, cursor, priority, syslog identifier, systemd unit, or kernel messages. Without a range or cursor, returns the last 50 entries by default. The priority, service, unit, kernel and structured filters need a recent PVE 9.x",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
      since: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Entries since this UNIX epoch (conflicts with startcursor)"),
      until: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Entries until this UNIX epoch (conflicts with endcursor)"),
      lastentries: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe(
          "Limit to the last N entries (conflicts with a range; default: 50 when no range or cursor is given)",
        ),
      startcursor: z
        .string()
        .optional()
        .describe("Start after this journal cursor (conflicts with since)"),
      endcursor: z
        .string()
        .optional()
        .describe("End before this journal cursor (conflicts with until)"),
      priority: z
        .string()
        .regex(/^([0-7](\.\.[0-7])?)?$/)
        .optional()
        .describe(
          "Syslog priority: a level 0 (emerg) to 7 (debug) selecting it and everything more severe, or a 'LOW..HIGH' range (e.g. '3' for errors and worse)",
        ),
      service: z
        .string()
        .regex(/^[A-Za-z0-9_.@:*?![\]/-]+$/)
        .max(128)
        .optional()
        .describe("Syslog identifier glob, e.g. 'pve*' or 'postfix/*'"),
      unit: z
        .string()
        .regex(/^[A-Za-z0-9_.@:-]+$/)
        .max(256)
        .optional()
        .describe("Systemd unit (the .service suffix is implied)"),
      kernel: z.boolean().optional().describe("Only kernel messages"),
      structured: z
        .boolean()
        .optional()
        .describe(
          "Return one JSON object per entry (timestamp, identifier, message, priority, ...) instead of text lines",
        ),
    },
    handler: async (args) => {
      let path = `/nodes/${args.node}/journal`;
      const params = new URLSearchParams();
      for (const key of [
        "since",
        "until",
        "lastentries",
        "startcursor",
        "endcursor",
        "priority",
        "service",
        "unit",
      ] as const) {
        if (args[key] !== undefined) params.set(key, String(args[key]));
      }
      if (args.kernel !== undefined)
        params.set("kernel", args.kernel ? "1" : "0");
      if (args.structured !== undefined)
        params.set("structured", args.structured ? "1" : "0");
      const hasRange =
        args.since !== undefined ||
        args.until !== undefined ||
        args.startcursor !== undefined ||
        args.endcursor !== undefined;
      if (args.lastentries === undefined && !hasRange)
        params.set("lastentries", "50");
      const qs = params.toString();
      if (qs) path += `?${qs}`;
      const data = await client.get(path);
      return JSON.stringify(data, null, 2);
    },
  });

  registerTool(server, config, {
    name: "pve_list_node_disks",
    title: "List Node Disks",
    description:
      "List local disks of a specific node with model, serial, size, usage, wearout and SMART health",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
      "include-partitions": z
        .boolean()
        .optional()
        .describe("Also include partitions"),
      skipsmart: z.boolean().optional().describe("Skip SMART health checks"),
      type: z
        .enum(["unused", "journal_disks"])
        .optional()
        .describe("Only list disks of this type"),
    },
    handler: async (args) => {
      let path = `/nodes/${args.node}/disks/list`;
      const params = new URLSearchParams();
      if (args["include-partitions"] !== undefined)
        params.set(
          "include-partitions",
          args["include-partitions"] ? "1" : "0",
        );
      if (args.skipsmart !== undefined)
        params.set("skipsmart", args.skipsmart ? "1" : "0");
      if (args.type !== undefined) params.set("type", String(args.type));
      const qs = params.toString();
      if (qs) path += `?${qs}`;
      const data = await client.get(path);
      return JSON.stringify(data, null, 2);
    },
  });

  registerTool(server, config, {
    name: "pve_get_node_disk_smart",
    title: "Get Node Disk SMART",
    description: "Get SMART health and attributes of a disk on a specific node",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
      disk: z
        .string()
        .regex(/^\/dev\/[a-zA-Z0-9/]+$/)
        .describe("Block device path (e.g. /dev/sda, /dev/nvme0n1)"),
      healthonly: z
        .boolean()
        .optional()
        .describe("Return only the health status"),
    },
    handler: async (args) => {
      const params = new URLSearchParams({ disk: String(args.disk) });
      if (args.healthonly !== undefined)
        params.set("healthonly", args.healthonly ? "1" : "0");
      const data = await client.get(
        `/nodes/${args.node}/disks/smart?${params.toString()}`,
      );
      return JSON.stringify(data, null, 2);
    },
  });

  registerTool(server, config, {
    name: "pve_list_node_lvm",
    title: "List Node LVM",
    description:
      "List LVM volume groups and their physical volumes on a specific node",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
    },
    handler: async (args) => {
      const data = await client.get(`/nodes/${args.node}/disks/lvm`);
      return JSON.stringify(data, null, 2);
    },
  });

  registerTool(server, config, {
    name: "pve_list_node_lvmthin",
    title: "List Node LVM Thin Pools",
    description:
      "List LVM thin pools on a specific node with data and metadata usage",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
    },
    handler: async (args) => {
      const data = await client.get(`/nodes/${args.node}/disks/lvmthin`);
      return JSON.stringify(data, null, 2);
    },
  });

  registerTool(server, config, {
    name: "pve_list_node_package_versions",
    title: "List Node Package Versions",
    description:
      "List installed versions of the Proxmox VE related packages on a specific node (like pveversion -v)",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
    },
    handler: async (args) => {
      const data = await client.get(`/nodes/${args.node}/apt/versions`);
      return JSON.stringify(data, null, 2);
    },
  });

  registerTool(server, config, {
    name: "pve_list_node_apt_updates",
    title: "List Node APT Updates",
    description:
      "List available package updates on a specific node, as of the last package database refresh. Requires Sys.Modify on /nodes/{node}",
    category: "nodes",
    accessTier: "read-only",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
    },
    handler: async (args) => {
      const data = await client.get(`/nodes/${args.node}/apt/update`);
      return JSON.stringify(data, null, 2);
    },
  });

  // --- Read-execute tools ---

  registerTool(server, config, {
    name: "pve_manage_node_service",
    title: "Manage Node Service",
    description:
      "Start, stop, restart, or reload a system service on a specific node",
    category: "nodes",
    accessTier: "read-execute",
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    inputSchema: {
      node: z.string().describe("The node name"),
      service: z
        .string()
        .describe("The service name (e.g. pveproxy, pvedaemon)"),
      command: z
        .enum(["start", "stop", "restart", "reload"])
        .describe("The action to perform on the service"),
    },
    handler: async (args) => {
      const data = await client.post(
        `/nodes/${args.node}/services/${args.service}/${args.command}`,
      );
      return `Service ${args.service} ${args.command} initiated on node ${args.node}. Task: ${data}`;
    },
  });
}
