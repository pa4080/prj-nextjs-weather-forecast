import React, { ChangeEvent, useEffect, useRef, useState } from "react";

import { ChevronDown } from "lucide-react";

import messages from "@/messages/en.json";
import { UnitsOptions } from "@/types/weather";
import { City, Country, State, StateFull } from "@/types/geo";
import { cn } from "@/lib/cn-utils";
import { Skeleton } from "@/components/ui/skeleton";

import SelectDropdownListGenerator from "./SelectDwListGen";

export type ItemType = Country | State | City | UnitsOptions[number] | StateFull;

interface Props {
	className?: string;
	placeHolder?: string;
	items: ItemType[] | false;
	defaultItem?: ItemType;
	inputClassName?: string;
	onTextChange?: (event: ChangeEvent<HTMLInputElement>) => void;
	onChange: (item: ItemType) => void;
	showFlag?: boolean;
	inputDisabled?: boolean;
}

const SelectDropdown: React.FC<Props> = ({
	className,
	placeHolder,
	items,
	onChange,
	onTextChange,
	defaultItem,
	showFlag = true,
	inputDisabled = false,
}) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [shouldFocus, setShouldFocus] = useState(false);

	const [selectedItem, setSelectedItem] = useState<ItemType>();
	const [searchValue, setSearchValue] = useState("");

	const searchInputRef = useRef<HTMLInputElement>(null);
	const searchWrapperRef = useRef<HTMLInputElement>(null);
	const focusWrapperRef = useRef<HTMLDivElement>(null);

	const displayText = (name?: string) =>
		`${showFlag && selectedItem?.emoji ? selectedItem.emoji + " " : ""}${
			name ?? selectedItem?.name
		}`;

	useEffect(() => {
		if (defaultItem) {
			setSelectedItem(defaultItem);
		}
	}, [defaultItem]);

	useEffect(() => {
		if (isMenuOpen && searchInputRef.current) {
			searchInputRef.current.focus();
		}

		if (!isMenuOpen && focusWrapperRef.current) {
			focusWrapperRef.current.focus();
		}

		setSearchValue("");
	}, [isMenuOpen]);

	useEffect(() => {
		// Hide menu when clicked outside
		const handleClickOutsideMenu = (e: MouseEvent) => {
			if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Element)) {
				setIsMenuOpen(false);
			}
		};

		window.addEventListener("click", handleClickOutsideMenu);

		return () => {
			window.removeEventListener("click", handleClickOutsideMenu);
		};
	}, []);

	const handleInputClick = (
		e: React.MouseEvent<HTMLDivElement, MouseEvent> | ChangeEvent<HTMLInputElement>
	) => {
		e.stopPropagation();

		const event = (e as ChangeEvent<HTMLInputElement>).target;

		event.select();
		event.setSelectionRange(0, event.value.length);

		setIsMenuOpen(true);
	};

	const handleToggleMenu = () => {
		setIsMenuOpen((prev) => !prev);
	};

	const getDisplay = () => {
		if (isMenuOpen && searchInputRef.current && displayText().startsWith(searchValue)) {
			searchInputRef.current.select();
			searchInputRef.current.setSelectionRange(0, searchInputRef.current.value.length);
		}

		if (!selectedItem) {
			return searchValue ?? "";
		}

		return displayText();
	};

	const onItemClick = (option: ItemType) => {
		setShouldFocus(true);
		setSelectedItem(option);
		onChange(option);
	};

	const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		e.preventDefault();

		setSearchValue(e.target.value);
		setSelectedItem(undefined);

		if (onTextChange) {
			onTextChange(e);
		}
	};

	const getOptions = () => {
		if (!searchValue) {
			return items ? items : [];
		}

		if ((items as ItemType[])[0].hasOwnProperty("cities")) {
			const states = items as StateFull[];

			const returnOptions = states
				? states
						?.map((state) => {
							const cities = state.cities.filter(
								(city) => city.name.toLowerCase().indexOf(searchValue.toLowerCase()) >= 0
							);

							if (cities.length > 0) {
								return {
									...state,
									cities,
								};
							} else {
								return {
									...state,
									cities: [],
								};
							}
						})
						.filter((state) => state.cities.length > 0)
				: [];

			return returnOptions;
		}

		const returnOptions = items
			? items?.filter((option) => option.name.toLowerCase().indexOf(searchValue.toLowerCase()) >= 0)
			: [];

		return returnOptions;
	};

	useEffect(() => {
		// Handle Enter key press within the search input field
		const inputField = searchInputRef.current;

		if (!inputField) {
			return;
		}

		const handlePressEnter = (event: KeyboardEvent) => {
			event.stopPropagation();

			const searchOptions = items
				? items?.filter(
						(option) => option.name.toLowerCase().indexOf(inputField.value.toLowerCase()) >= 0
				  )
				: [];

			if (searchOptions.length === 1 && event.key === "Enter") {
				setShouldFocus(true);
				setSelectedItem(searchOptions[0]);
				onChange(searchOptions[0]);
				setTimeout(() => {
					setIsMenuOpen(false);
				}, 200);
			}
		};

		inputField.addEventListener("keypress", handlePressEnter);

		return () => {
			inputField.removeEventListener("keypress", handlePressEnter);
		};
	}, [onChange, items]);

	return (
		<div
			ref={focusWrapperRef}
			aria-label={messages.Select.buttonAreaLabel}
			className={"select_focus_wrapper"}
			data-focus={shouldFocus}
			tabIndex={-1}
		>
			{items && items.length > 0 ? (
				<div className={"relative"}>
					<div
						ref={searchWrapperRef}
						className={cn(
							"select_search_main w-[240px] h-[50px]  ",
							`${isMenuOpen ? "bg-gray-100" : "bg-gray-100/90"}`,
							className
						)}
						tabIndex={-1}
						onClick={handleToggleMenu}
					>
						{inputDisabled && <div className={"select_search_input"}>{getDisplay()}</div>}
						<input
							ref={searchInputRef}
							className={"select_search_input"}
							disabled={inputDisabled}
							name={placeHolder}
							placeholder={placeHolder}
							style={{
								zIndex: inputDisabled ? -1 : 1,
								opacity: inputDisabled ? 0 : 1,
							}}
							tabIndex={inputDisabled ? -1 : 0}
							value={getDisplay()}
							onChange={onSearch}
							onClick={handleInputClick}
						/>

						<div
							className={
								"data-[state=open]:rotate-90 transition-transform duration-200 cursor-pointer"
							}
							data-state={isMenuOpen ? "open" : "closed"}
						>
							<ChevronDown />
						</div>
					</div>

					{isMenuOpen && (
						<SelectDropdownListGenerator
							isMenuOpen={isMenuOpen}
							items={getOptions()}
							selectedItem={selectedItem}
							setIsMenuOpen={setIsMenuOpen}
							onItemClick={onItemClick}
						/>
					)}
				</div>
			) : (
				<Skeleton className={cn("select_search_main bg-gray-100/70 w-[240px] h-[50px]", className)}>
					<input
						className={"select_search_input text-gray-300"}
						disabled={true}
						name={placeHolder}
						placeholder={placeHolder}
						value={placeHolder}
					/>

					<div className={"text-gray-200"}>
						<ChevronDown />
					</div>
				</Skeleton>
			)}
		</div>
	);
};

export default SelectDropdown;
