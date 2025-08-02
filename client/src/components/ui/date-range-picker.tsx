"use client";

import { addDays, format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerWithRangeProps {
	className?: string;
	date?: DateRange;
	onDateChange?: (date: DateRange | undefined) => void;
	placeholder?: string;
}

export function DatePickerWithRange({
	className,
	date,
	onDateChange,
	placeholder = "Seleziona periodo",
}: DatePickerWithRangeProps) {
	const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(
		date,
	);

	React.useEffect(() => {
		setSelectedDate(date);
	}, [date]);

	const handleDateChange = (newDate: DateRange | undefined) => {
		setSelectedDate(newDate);
		onDateChange?.(newDate);
	};

	return (
		<div className={cn("grid gap-2", className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id="date"
						variant={"outline"}
						className={cn(
							"w-[300px] justify-start text-left font-normal",
							!selectedDate && "text-muted-foreground",
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{selectedDate?.from ? (
							selectedDate.to ? (
								<>
									{format(selectedDate.from, "dd LLL y", { locale: it })} -{" "}
									{format(selectedDate.to, "dd LLL y", { locale: it })}
								</>
							) : (
								format(selectedDate.from, "dd LLL y", { locale: it })
							)
						) : (
							<span>{placeholder}</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						initialFocus
						mode="range"
						defaultMonth={selectedDate?.from}
						selected={selectedDate}
						onSelect={handleDateChange}
						numberOfMonths={2}
						locale={it}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
