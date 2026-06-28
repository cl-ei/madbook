import datetime
from pydantic import BaseModel, BaseConfig


def convert_datetime_to_realworld(d: datetime.datetime) -> str:
    return str(d)


def convert_field_to_camel_case(s: str) -> str:
    return s.lower()


class RWSchema(BaseModel):
    class Config(BaseConfig):
        allow_population_by_field_name = True
        json_encoders = {datetime.datetime: convert_datetime_to_realworld}
        alias_generator = convert_field_to_camel_case
        orm_mode = True
