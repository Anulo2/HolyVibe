import type { Table } from "@tanstack/react-table";
import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	Download,
	Trash2,
	X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	searchPlaceholder?: string;
	selectedRows?: string[];
	onBatchStatusUpdate?: (status: string) => void;
	onBatchDelete?: () => void;
	onExport?: () => void;
}

export function DataTableToolbar<TData>({
	table,
	searchValue,
	onSearchChange,
	searchPlaceholder = "Filtra risultati...",
	selectedRows = [],
	onBatchStatusUpdate,
	onBatchDelete,
	onExport,
}: DataTableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0;

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 items-center space-x-2">
				{onSearchChange && (
					<Input
						placeholder={searchPlaceholder}
						value={searchValue ?? ""}
						onChange={(event) => onSearchChange(event.target.value)}
						className="h-8 w-[150px] lg:w-[250px]"
					/>
				)}
				{isFiltered && (
					<Button
						variant="ghost"
						onClick={() => table.resetColumnFilters()}
						className="h-8 px-2 lg:px-3"
					>
						Reset
						<X className="ml-2 h-4 w-4" />
					</Button>
				)}

				{/* Batch Actions */}
				{selectedRows.length > 0 && (
					<div className="flex items-center space-x-2">
						<Badge variant="secondary" className="h-8">
							{selectedRows.length} selezionate
						</Badge>

						{onBatchStatusUpdate && (
							<Select onValueChange={onBatchStatusUpdate}>
								<SelectTrigger className="h-8 w-[140px]">
									<SelectValue placeholder="Aggiorna stato" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="pending">
										<div className="flex items-center gap-2">
											<Clock className="h-4 w-4" />
											In attesa
										</div>
									</SelectItem>
									<SelectItem value="confirmed">
										<div className="flex items-center gap-2">
											<CheckCircle2 className="h-4 w-4" />
											Confermata
										</div>
									</SelectItem>
									<SelectItem value="cancelled">
										<div className="flex items-center gap-2">
											<X className="h-4 w-4" />
											Cancellata
										</div>
									</SelectItem>
									<SelectItem value="waitlist">
										<div className="flex items-center gap-2">
											<AlertTriangle className="h-4 w-4" />
											Lista d'attesa
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						)}

						{onBatchDelete && (
							<Button
								variant="outline"
								size="sm"
								className="h-8"
								onClick={onBatchDelete}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Elimina
							</Button>
						)}
					</div>
				)}
			</div>

			<div className="flex items-center space-x-2">
				{onExport && (
					<Button
						variant="outline"
						size="sm"
						className="h-8"
						onClick={onExport}
					>
						<Download className="mr-2 h-4 w-4" />
						Esporta
					</Button>
				)}
				<DataTableViewOptions table={table} />
			</div>
		</div>
	);
}
