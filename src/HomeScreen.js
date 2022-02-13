import React, { useState } from "react";
import type { Node } from "react";
import { TextInput, ActivityIndicator, useColorScheme, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MenuView } from "@react-native-menu/menu";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Animated } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import styles from "./Styles";
import epilogueStorage from "./Storage";

export function HomeScreen({ navigation }) {
	const is_dark = (useColorScheme() == "dark");
	const [ books, setBooks ] = useState();
	const [ bookshelves, setBookshelves ] = useState([]);
	const [ searchText, setSearchText ] = useState("");
	var current_bookshelf = { id: 0, title: "" };
  
	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);
  
	function onFocus(navigation) {
		// epilogueStorage.set("auth_token", "TESTING").then(() => {
		// });

		loadBookshelves(navigation);
	}
  
	function loadBooks(bookshelf_id, handler = function() {}) {
		epilogueStorage.get("auth_token").then(auth_token => {	  
			var options = {
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};
			
			for (let shelf of bookshelves) {
				if (shelf.id == bookshelf_id) {
					current_bookshelf = shelf;
				}
			}
			
			fetch("https://micro.blog/books/bookshelves/" + bookshelf_id, options).then(response => response.json()).then(data => {
				var new_items = [];
				for (let item of data.items) {
					var author_name = "";
					if (item.authors.length > 0) {
						author_name = item.authors[0].name;
					}
					new_items.push({
						id: item.id,
						isbn: item._microblog.isbn,
						title: item.title,
						image: item.image,
						author: author_name
					});
				}
				
				setBooks(new_items);
				handler();
			});		
		});
	}
  
	function loadBookshelves(navigation) {
		epilogueStorage.get("auth_token").then(auth_token => {
			var options = {
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};

			fetch("https://micro.blog/books/bookshelves", options).then(response => response.json()).then(data => {
				var new_items = [];
				for (let item of data.items) {
					var s;
					if (item._microblog.books_count == 1) {
						s = "1 book";
					}
					else {
						s = item._microblog.books_count + " books";
					}
					
					new_items.push({
						id: item.id.toString(),
						title: item.title,
						books_count: s
					});
				}
				
				setBookshelves(new_items);
				if (current_bookshelf.id == 0) {
					let first_bookshelf = new_items[0];
					current_bookshelf = first_bookshelf;
				}
				loadBooks(current_bookshelf.id);
				setupBookshelves(navigation, new_items, current_bookshelf.title);
			});		
		});
	}

	function setupBookshelves(navigation, items, currentTitle) {
		navigation.setOptions({
			headerRight: () => (
				<MenuView
				onPressAction = {({ nativeEvent }) => {
					let shelf_id = nativeEvent.event;
					loadBooks(shelf_id, function() {
						setupBookshelves(navigation, bookshelves, current_bookshelf.title);
					});
				}}
				actions = {items}
				>
					<View style={styles.navbarBookshelf}>
						<Image style={styles.navbarBookshelfIcon} source={require("../images/books.png")} />
						<Text style={styles.navbarBookshelfTitle}>{currentTitle}</Text>
					</View>
				</MenuView>
			)
		});
	}

	function onShowBookPressed(item) {
		var params = {
			id: item.id,
			isbn: item.isbn,
			title: item.title,
			image: item.image,
			author: item.author,
			bookshelves: bookshelves
			};
		navigation.navigate("Details", params);
	}
  
	function removeFromBookshelf() {	  
	}

	function onSearch() {
		if (searchText.length > 0) {			
		}
		else {
		}
	}

	renderRightActions = (progress, dragX) => {
		const trans = dragX.interpolate({
			inputRange: [0, 50, 100, 101],
			outputRange: [0, 0, 0, 1],
		});
	
		return (
			<RectButton style={styles.removeAction} onPress={() => {
				removeFromBookshelf();
			}}>
			<View style={styles.removeContainer}>
				<Animated.Text style={[ styles.removeText, {
					transform: [{ translateX: trans }],
				}]}>
					Remove
				</Animated.Text>
				</View>
			</RectButton>
		);
	};

	return (
		<View style={is_dark ? [ styles.container, styles.dark.container ] : styles.container}>
			<TextInput style={is_dark ? [ styles.searchField, styles.dark.searchField ] : styles.searchField} onChangeText={setSearchText} value={searchText} onEndEditing={onSearch} returnKeyType="search" placeholder="Search for books to add" />
			<FlatList
				data = {books}
				renderItem = { ({item}) => 
				<Swipeable renderRightActions={renderRightActions}>
					<Pressable onPress={() => { onShowBookPressed(item) }}>
						<View style={is_dark ? [ styles.item, styles.dark.item ] : styles.item}>
							<Image style={styles.bookCover} source={{ uri: item.image.replace("http://", "https://") }} />
							<View style={styles.bookItem}>
								<Text style={is_dark ? [ styles.bookTitle, styles.dark.bookTitle ] : styles.bookTitle} ellipsizeMode="tail" numberOfLines={2}>{item.title}</Text>
								<Text style={is_dark ? [ styles.bookAuthor, styles.dark.bookAuthor ] : styles.bookAuthor}>{item.author}</Text>
							</View>
						</View>
					</Pressable>
				</Swipeable>
				}
				keyExtractor = { item => item.id }
			/>
		</View>
	);
}