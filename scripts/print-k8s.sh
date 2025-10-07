#!/bin/bash

# Sprawdź, czy katalog istnieje
if [ -d "./k8s/" ]; then
  echo "Przeglądanie katalogu ./k8s/:"
  echo "--------------------------"

  # Przejdź przez każdy element w katalogu
  for item in ./k8s/*; do
    # Sprawdź, czy to jest plik (a nie katalog)
    if [ -f "$item" ]; then
      # Wypisz nazwę pliku
      echo "### Nazwa pliku: $(basename "$item") ###"
      echo "--- Zawartość ---"
      # Wypisz zawartość pliku
      cat "$item"
      echo "-----------------------------------------------------"
      echo "" # Pusta linia dla lepszej czytelności między plikami
    fi
  done
else
  echo "Katalog ./k8s/ nie istnieje."
fi