"use client";

import { Edit } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getRoleLabel } from "../constants";

import type { SalesPersonListItem } from "../types";

interface SalesPersonsTableProps {
  salesPersons: SalesPersonListItem[];
  startIndex: number;
}

export function SalesPersonsTable({
  salesPersons,
  startIndex,
}: SalesPersonsTableProps) {
  if (salesPersons.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border text-muted-foreground">
        該当する営業担当者が見つかりませんでした
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">No</TableHead>
            <TableHead>氏名</TableHead>
            <TableHead>部署</TableHead>
            <TableHead>上長</TableHead>
            <TableHead className="w-24">権限</TableHead>
            <TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {salesPersons.map((person, index) => (
            <TableRow key={person.sales_person_id}>
              <TableCell className="font-medium">
                {startIndex + index + 1}
              </TableCell>
              <TableCell>{person.name}</TableCell>
              <TableCell>{person.department}</TableCell>
              <TableCell>{person.manager_name || "-"}</TableCell>
              <TableCell>
                <Badge variant={person.is_manager ? "default" : "secondary"}>
                  {getRoleLabel(person.is_manager)}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/sales-persons/${person.sales_person_id}/edit`}>
                    <Edit className="mr-1 h-4 w-4" />
                    編集
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
