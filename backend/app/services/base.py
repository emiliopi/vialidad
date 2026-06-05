from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
import logging

logger = logging.getLogger("app.services.base")

# Definición de tipos genéricos para el Modelo SQLAlchemy y los esquemas Pydantic
ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        """
        Objeto CRUD con métodos por defecto para Crear, Leer, Actualizar, Borrar (CRUD).

        **Parámetros**

        * `model`: Una clase de modelo SQLAlchemy
        * `schema`: Una clase de esquema Pydantic (BaseModel)
        """
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        Obtiene un registro único por su identificador primario.
        """
        try:
            return db.get(self.model, id)
        except SQLAlchemyError as e:
            logger.error(f"Error al obtener registro {self.model.__name__} con ID {id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error en el servidor al buscar el registro."
            )

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """
        Obtiene múltiples registros paginados.
        """
        try:
            stmt = select(self.model).offset(skip).limit(limit)
            return list(db.scalars(stmt).all())
        except SQLAlchemyError as e:
            logger.error(f"Error al listar registros {self.model.__name__}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error en el servidor al listar los registros."
            )

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """
        Crea un nuevo registro a partir de un esquema Pydantic.
        """
        try:
            obj_in_data = obj_in.model_dump()
            db_obj = self.model(**obj_in_data)  # type: ignore
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Error al crear registro {self.model.__name__}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al guardar el registro en la base de datos."
            )

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """
        Actualiza un registro existente a partir de un esquema Pydantic o un diccionario.
        """
        try:
            # Obtener datos del objeto actual como diccionario
            obj_data = {}
            for column in db_obj.__table__.columns: # type: ignore
                obj_data[column.name] = getattr(db_obj, column.name)

            if isinstance(obj_in, dict):
                update_data = obj_in
            else:
                update_data = obj_in.model_dump(exclude_unset=True)

            for field in obj_data:
                if field in update_data:
                    setattr(db_obj, field, update_data[field])

            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Error al actualizar registro {self.model.__name__}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar el registro en la base de datos."
            )

    def remove(self, db: Session, *, id: Any) -> Optional[ModelType]:
        """
        Elimina un registro único de la base de datos.
        """
        try:
            obj = db.get(self.model, id)
            if obj:
                db.delete(obj)
                db.commit()
            return obj
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Error al eliminar registro {self.model.__name__} con ID {id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar el registro de la base de datos."
            )
